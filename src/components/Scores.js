import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API_URL from "../config";

export default function Scores() {
  const [scores, setScores] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("roll"); // roll, score, alerts
  const [filterStatus, setFilterStatus] = useState("all"); // all, passed, failed
  const navigate = useNavigate();

  // Fetch scores and alerts
  useEffect(() => {
    // Fetch scores with alert counts
    fetch(`${API_URL}/scores-with-alerts`)
      .then(res => res.json())
      .then(data => {
        if (data.scores) {
          setScores(data.scores);
        } else {
          setError("No scores found.");
        }
      })
      .catch(err => {
        console.error('Error fetching scores:', err);
        setError("Failed to fetch scores.");
      });

    // Fetch detailed alerts
    fetch(`${API_URL}/alerts`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAlerts(data);
        }
      })
      .catch(err => {
        console.error('Error fetching alerts:', err);
      });
  }, []);

  const handleBack = () => {
    navigate('/proctor-dashboard');
  };

  // Get detailed alert breakdown for a student
  const getStudentAlertBreakdown = (rollNumber) => {
    const studentAlerts = alerts.filter(alert => alert.roll_number === rollNumber);
    const breakdown = {
      left: 0,
      right: 0,
      up: 0,
      down: 0,
      tilt: 0,
      audio: 0,
      faceMismatch: 0,
      multipleFaces: 0,
      noFace: 0,
      forbiddenObject: 0,
      tabSwitch: 0,
      total: studentAlerts.length
    };

    studentAlerts.forEach(alert => {
      const dir = alert.direction.toLowerCase();
      if (dir.includes("left")) breakdown.left++;
      else if (dir.includes("right")) breakdown.right++;
      else if (dir.includes("up")) breakdown.up++;
      else if (dir.includes("down")) breakdown.down++;
      else if (dir.includes("tilt")) breakdown.tilt++;
      else if (dir.includes("voice") || dir.includes("audio")) breakdown.audio++;
      else if (dir.includes("face mismatch")) breakdown.faceMismatch++;
      else if (dir.includes("multiple faces")) breakdown.multipleFaces++;
      else if (dir.includes("no face")) breakdown.noFace++;
      else if (dir.includes("forbidden object")) breakdown.forbiddenObject++;
      else if (dir.includes("tab switch")) breakdown.tabSwitch++;
    });

    return breakdown;
  };

  // Filtered and sorted scores
  const getFilteredScores = () => {
    let filtered = scores.filter(student =>
      student.roll_number.toLowerCase().includes(search.toLowerCase()) ||
      student.username.toLowerCase().includes(search.toLowerCase())
    );

    // Apply status filter
    if (filterStatus === "passed") {
      filtered = filtered.filter(s => s.score >= 5);
    } else if (filterStatus === "failed") {
      filtered = filtered.filter(s => s.score < 5);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "score") {
        return (b.score || 0) - (a.score || 0);
      } else if (sortBy === "alerts") {
        return (b.alert_count || 0) - (a.alert_count || 0);
      } else {
        return a.roll_number.localeCompare(b.roll_number);
      }
    });

    return filtered;
  };

  const filteredScores = getFilteredScores();

  // Calculate statistics
  const totalStudents = scores.length;
  const averageScore = scores.length > 0 
    ? (scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length).toFixed(2)
    : 0;
  const passedStudents = scores.filter(s => s.score >= 5).length;
  const failedStudents = scores.filter(s => s.score < 5).length;
  const totalAlerts = scores.reduce((sum, s) => sum + (s.alert_count || 0), 0);

  // Individual student PDF download (comprehensive)
  const downloadStudentPDF = (student) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const alertBreakdown = getStudentAlertBreakdown(student.roll_number);
    const studentAlertsList = alerts.filter(a => a.roll_number === student.roll_number);

    // Header Section
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT EXAM REPORT", pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("AI Proctored Online Examination", pageWidth / 2, 25, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 33, { align: 'center' });

    let yPos = 50;

    // Student Information Card
    doc.setFillColor(248, 215, 218);
    doc.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(114, 28, 36);
    doc.text("Student Information", 20, yPos + 10);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${student.username}`, 20, yPos + 20);
    doc.text(`Roll Number: ${student.roll_number}`, 20, yPos + 30);
    doc.text(`Exam Date: ${new Date().toLocaleDateString()}`, 20, yPos + 40);

    yPos += 55;

    // Score Section
    doc.setFillColor(220, 53, 69);
    doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Exam Score", 20, yPos + 10);
    
    doc.setFontSize(24);
    doc.text(`${student.score || 0} / 10`, pageWidth / 2, yPos + 25, { align: 'center' });
    
    const percentage = student.score !== null ? Math.round((student.score / 10) * 100) : 0;
    doc.setFontSize(14);
    doc.text(`(${percentage}%)`, pageWidth / 2, yPos + 32, { align: 'center' });

    yPos += 45;

    // Status Badge
    const isPassed = student.score >= 5;
    doc.setFillColor(isPassed ? 40 : 220, isPassed ? 167 : 53, 69);
    doc.roundedRect((pageWidth - 60) / 2, yPos, 60, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(isPassed ? "PASSED" : "FAILED", pageWidth / 2, yPos + 8, { align: 'center' });

    yPos += 22;

    // Alert Summary Section
    doc.setFillColor(alertBreakdown.total > 0 ? 248 : 212, alertBreakdown.total > 0 ? 215 : 237, alertBreakdown.total > 0 ? 218 : 218);
    doc.roundedRect(15, yPos, pageWidth - 30, 60, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(alertBreakdown.total > 0 ? 114 : 21, alertBreakdown.total > 0 ? 28 : 87, alertBreakdown.total > 0 ? 36 : 36);
    doc.text("Proctoring Alert Summary", 20, yPos + 10);
    
    doc.setFontSize(20);
    doc.text(`${alertBreakdown.total} Total Alerts`, pageWidth / 2, yPos + 25, { align: 'center' });

    // Alert breakdown in 2 columns
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let alertYPos = yPos + 35;
    const leftCol = 20;
    const rightCol = pageWidth / 2 + 10;

    const alertTypes = [
      { icon: 'L', label: 'Looking Left', count: alertBreakdown.left },
      { icon: 'R', label: 'Looking Right', count: alertBreakdown.right },
      { icon: 'U', label: 'Looking Up', count: alertBreakdown.up },
      { icon: 'D', label: 'Looking Down', count: alertBreakdown.down },
      { icon: 'T', label: 'Head Tilt', count: alertBreakdown.tilt },
      { icon: 'A', label: 'Audio/Voices', count: alertBreakdown.audio },
      { icon: 'FM', label: 'Face Mismatch', count: alertBreakdown.faceMismatch },
      { icon: 'MF', label: 'Multiple Faces', count: alertBreakdown.multipleFaces },
      { icon: 'NF', label: 'No Face', count: alertBreakdown.noFace },
      { icon: 'FO', label: 'Forbidden Object', count: alertBreakdown.forbiddenObject },
      { icon: 'TS', label: 'Tab Switch', count: alertBreakdown.tabSwitch }
    ].filter(a => a.count > 0);

    alertTypes.forEach((alert, idx) => {
      const col = idx % 2 === 0 ? leftCol : rightCol;
      const row = Math.floor(idx / 2);
      doc.text(`${alert.icon} ${alert.label}: ${alert.count}`, col, alertYPos + (row * 5));
    });

    yPos += 70;

    // Detailed Alert Log (if any)
    if (studentAlertsList.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Detailed Alert Timeline", 15, yPos);
      yPos += 5;

      const alertTableData = studentAlertsList.slice(0, 15).map((alert, idx) => {
        const timeStr = new Date(alert.time).toLocaleTimeString();
        return [
          idx + 1,
          timeStr,
          alert.direction.replace('ALERT: ', '')
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Time', 'Alert Type']],
        body: alertTableData,
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80] },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 9 }
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Footer
    const finalYPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("This is a computer-generated report from the AI Proctoring System", pageWidth / 2, finalYPos, { align: 'center' });
    doc.text("For any queries, contact the examination authority", pageWidth / 2, finalYPos + 5, { align: 'center' });

    // Save PDF
    doc.save(`${student.roll_number}_${student.username}_Report.pdf`);
  };

  // Download All Students PDF
  const downloadAllStudentsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ALL STUDENTS EXAM REPORT", pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 25, { align: 'center' });

    // Statistics Summary
    let yPos = 45;
    doc.setFillColor(232, 245, 233);
    doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Exam Statistics", 20, yPos + 8);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Students: ${totalStudents}`, 20, yPos + 16);
    doc.text(`Average Score: ${averageScore}/10`, 20, yPos + 23);
    doc.text(`Passed: ${passedStudents}`, 20, yPos + 30);
    
    doc.text(`Failed: ${failedStudents}`, pageWidth / 2 + 10, yPos + 16);
    doc.text(`Total Alerts: ${totalAlerts}`, pageWidth / 2 + 10, yPos + 23);

    yPos += 45;

    // Students Table
    const tableData = filteredScores.map(student => [
      student.roll_number,
      student.username,
      student.score || 'N/A',
      student.score !== null ? `${Math.round((student.score / 10) * 100)}%` : 'N/A',
      student.alert_count || 0,
      student.score >= 5 ? 'PASSED' : 'FAILED'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Roll No', 'Name', 'Score', 'Percentage', 'Alerts', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25, fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 5) {
          if (data.cell.text[0] === 'PASSED') {
            data.cell.styles.textColor = [21, 87, 36];
            data.cell.styles.fillColor = [212, 237, 218];
          } else {
            data.cell.styles.textColor = [114, 28, 36];
            data.cell.styles.fillColor = [248, 215, 218];
          }
        }
      }
    });

    // Footer
    const finalYPos = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("AI Proctoring System - Comprehensive Exam Report", pageWidth / 2, finalYPos, { align: 'center' });

    doc.save(`All_Students_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '40px' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          {/* Header */}
          <div style={{ 
            backgroundColor: '#2c3e50', 
            color: 'white', 
            padding: '30px', 
            borderRadius: '20px', 
            marginBottom: '30px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h1 style={{ margin: 0, fontWeight: 'bold', fontSize: '2.5rem' }}>
              📊 Student Exam Scores
            </h1>
            <p style={{ margin: '10px 0 0 0', fontSize: '1.1rem', opacity: 0.9 }}>
              Comprehensive overview with AI proctoring insights
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-3 col-sm-6 mb-3">
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center',
                border: '2px solid #e9ecef'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>{totalStudents}</div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Total Students</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center',
                border: '2px solid #28a745'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{passedStudents}</div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Passed</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center',
                border: '2px solid #dc3545'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>❌</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{failedStudents}</div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Failed</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center',
                border: '2px solid #ffc107'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📈</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>{averageScore}</div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Average Score</div>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '15px',
            marginBottom: '30px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div className="row align-items-center">
              <div className="col-md-4 mb-3 mb-md-0">
                <input 
                  type="text" 
                  placeholder="🔍 Search by roll no or name..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: '2px solid #e9ecef',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="col-md-3 mb-3 mb-md-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-select"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: '2px solid #e9ecef',
                    fontSize: '16px'
                  }}
                >
                  <option value="roll">Sort by Roll No</option>
                  <option value="score">Sort by Score</option>
                  <option value="alerts">Sort by Alerts</option>
                </select>
              </div>
              <div className="col-md-3 mb-3 mb-md-0">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-select"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: '2px solid #e9ecef',
                    fontSize: '16px'
                  }}
                >
                  <option value="all">All Students</option>
                  <option value="passed">Passed Only</option>
                  <option value="failed">Failed Only</option>
                </select>
              </div>
              <div className="col-md-2">
                <button
                  onClick={downloadAllStudentsPDF}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  📥 Download All
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              padding: '20px', 
              borderRadius: '15px', 
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Student Cards */}
          <div className="row">
            {filteredScores.map((student) => {
              const alertBreakdown = getStudentAlertBreakdown(student.roll_number);
              const isPassed = student.score >= 5;
              const hasHighAlerts = student.alert_count > 5;
              
              return (
                <div key={student.roll_number} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                  <div style={{ 
                    backgroundColor: 'white',
                    padding: '20px', 
                    borderRadius: '15px',
                    border: `3px solid ${hasHighAlerts ? '#dc3545' : isPassed ? '#28a745' : '#ffc107'}`,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer',
                    height: '100%',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: isPassed ? '#28a745' : '#dc3545',
                      color: 'white',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {isPassed ? '✓ PASSED' : '✗ FAILED'}
                    </div>

                    <div style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 'bold', 
                      color: '#2c3e50',
                      marginBottom: '5px',
                      marginTop: '15px'
                    }}>
                      {student.username}
                    </div>
                    
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#6c757d',
                      marginBottom: '15px'
                    }}>
                      Roll: {student.roll_number}
                    </div>

                    {/* Score Display */}
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '15px',
                      borderRadius: '10px',
                      marginBottom: '15px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '5px' }}>
                        Score
                      </div>
                      <div style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: 'bold', 
                        color: isPassed ? '#28a745' : '#dc3545'
                      }}>
                        {student.score !== null ? student.score : "N/A"}<span style={{ fontSize: '1.5rem' }}>/10</span>
                      </div>
                      <div style={{ fontSize: '1rem', color: '#6c757d' }}>
                        {student.score !== null ? `${Math.round((student.score / 10) * 100)}%` : 'Pending'}
                      </div>
                    </div>

                    {/* Alert Summary */}
                    <div style={{
                      backgroundColor: alertBreakdown.total > 0 ? '#fff3cd' : '#d4edda',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: alertBreakdown.total > 0 ? '#856404' : '#155724'
                      }}>
                        {alertBreakdown.total > 0 ? '⚠️' : '✅'} {alertBreakdown.total} Alert{alertBreakdown.total !== 1 ? 's' : ''}
                      </div>
                      {alertBreakdown.total > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#856404', marginTop: '5px' }}>
                          {[
                            alertBreakdown.left > 0 && `L ${alertBreakdown.left}`,
                            alertBreakdown.right > 0 && `R ${alertBreakdown.right}`,
                            alertBreakdown.audio > 0 && `A ${alertBreakdown.audio}`,
                            alertBreakdown.forbiddenObject > 0 && `FO ${alertBreakdown.forbiddenObject}`
                          ].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => downloadStudentPDF(student)}
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                      📄 Download Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredScores.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
              <div style={{ fontSize: '1.5rem', color: '#6c757d', fontWeight: 'bold' }}>
                No students found
              </div>
              <div style={{ fontSize: '1rem', color: '#adb5bd', marginTop: '10px' }}>
                Try adjusting your search or filter criteria
              </div>
            </div>
          )}

          {/* Back Button */}
          <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px' }}>
            <button 
              onClick={handleBack}
              style={{
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '10px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(111, 66, 193, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#5a32a3';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#6f42c1';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}