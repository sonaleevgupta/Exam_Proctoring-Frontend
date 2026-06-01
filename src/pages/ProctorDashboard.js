import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import API_URL from "../config";

export default function ProctorDashboard() {
  const [alertData, setAlertData] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch scores with alerts from the combined endpoint
    fetch(`${API_URL}/scores-with-alerts`)
      .then(res => res.json())
      .then(data => {
        console.log('Scores with alerts received:', data);
        if (data.scores && Array.isArray(data.scores)) {
          // Fetch detailed alerts to get breakdown
          fetch(`${API_URL}/alerts`)
            .then(res => res.json())
            .then(alerts => {
              console.log('Alerts data received:', alerts);
              
              // Create a map of student alerts with detailed categorization
              const studentAlertsMap = {};
              if (Array.isArray(alerts)) {
                alerts.forEach(alert => {
                  const rollNumber = alert.roll_number;
                  if (!studentAlertsMap[rollNumber]) {
                    studentAlertsMap[rollNumber] = {
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
                      total: 0
                    };
                  }
                  
                  // Count all alerts
                  if (alert.direction.startsWith("ALERT")) {
                    studentAlertsMap[rollNumber].total++;
                    
                    // Categorize by type
                    const dir = alert.direction.toLowerCase();
                    if (dir.includes("left")) {
                      studentAlertsMap[rollNumber].left++;
                    } else if (dir.includes("right")) {
                      studentAlertsMap[rollNumber].right++;
                    } else if (dir.includes("up")) {
                      studentAlertsMap[rollNumber].up++;
                    } else if (dir.includes("down")) {
                      studentAlertsMap[rollNumber].down++;
                    } else if (dir.includes("tilt")) {
                      studentAlertsMap[rollNumber].tilt++;
                    } else if (dir.includes("voice") || dir.includes("audio")) {
                      studentAlertsMap[rollNumber].audio++;
                    } else if (dir.includes("face mismatch")) {
                      studentAlertsMap[rollNumber].faceMismatch++;
                    } else if (dir.includes("multiple faces")) {
                      studentAlertsMap[rollNumber].multipleFaces++;
                    } else if (dir.includes("no face")) {
                      studentAlertsMap[rollNumber].noFace++;
                    } else if (dir.includes("forbidden object")) {
                      studentAlertsMap[rollNumber].forbiddenObject++;
                    } else if (dir.includes("tab switch")) {
                      studentAlertsMap[rollNumber].tabSwitch++;
                    }
                  }
                });
              }

              // Merge scores with alert details
              const mergedData = data.scores.map(student => ({
                student: student.roll_number,
                username: student.username,
                score: student.score,
                counts: studentAlertsMap[student.roll_number] || {
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
                  total: 0
                }
              }));

              console.log('Merged data:', mergedData);
              setAlertData(mergedData);
            })
            .catch(error => {
              console.error('Error fetching alerts:', error);
              // If alerts fetch fails, still show students with zero alerts
              const fallbackData = data.scores.map(student => ({
                student: student.roll_number,
                username: student.username,
                score: student.score,
                counts: {
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
                  total: 0
                }
              }));
              setAlertData(fallbackData);
            });
        } else {
          setAlertData([]);
        }
      })
      .catch(error => {
        console.error('Error fetching scores:', error);
        setAlertData([]);
      });
  }, []);

  const alertBarData = alertData.map(({ student, counts }) => ({
    student,
    alerts: counts.total
  }));

  const studentWithMostAlerts = alertData.length > 0 
    ? alertData.reduce((max, current) => 
        current.counts.total > max.counts.total ? current : max
      )
    : null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSeeScore = () => {
    navigate('/scores');
  };

  // Helper function to render alert breakdown
  const renderAlertBreakdown = (counts) => {
    const alertTypes = [
      { label: 'Looking Left', count: counts.left, color: '#ffc107' },
      { label: 'Looking Right', count: counts.right, color: '#ffc107' },
      { label: 'Looking Up', count: counts.up, color: '#ffc107' },
      { label: 'Looking Down', count: counts.down, color: '#ffc107' },
      { label: 'Head Tilt', count: counts.tilt, color: '#ffc107' },
      { label: 'Audio/Voices', count: counts.audio, color: '#ff5722' },
      { label: 'Face Mismatch', count: counts.faceMismatch, color: '#e91e63' },
      { label: 'Multiple Faces', count: counts.multipleFaces, color: '#9c27b0' },
      { label: 'No Face', count: counts.noFace, color: '#673ab7' },
      { label: 'Forbidden Object', count: counts.forbiddenObject, color: '#f44336' },
      { label: 'Tab Switch', count: counts.tabSwitch, color: '#ff9800' }
    ];

    return alertTypes
      .filter(alert => alert.count > 0)
      .map((alert, idx) => (
        <div key={idx} style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '8px',
          padding: '8px 12px',
          backgroundColor: '#fff3cd',
          borderRadius: '6px',
          borderLeft: `4px solid ${alert.color}`
        }}>
          <span style={{ fontWeight: '500' }}>{alert.label}:</span>
          <span style={{ fontWeight: 'bold', color: alert.color }}>
            {alert.count} time{alert.count !== 1 ? 's' : ''}
          </span>
        </div>
      ));
  };

  return (
    <div className="container-fluid d-flex" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Left Sidebar */}
      <div className="position-fixed bg-dark text-white" style={{ width: '250px', height: '100vh', padding: '20px' }}>
        <h4 className="mb-4">Navigation</h4>
        <ul className="nav flex-column">
         { /* <li className="nav-item mb-3">
            <button className="btn btn-outline-light w-100 text-start" onClick={() => navigate('/instruction')}>
              Go to Home Page
            </button>
          </li> */}
          <li className="nav-item mb-3">
            <button className="btn btn-outline-light w-100 text-start" onClick={handleLogout}>
              Logout
            </button>
          </li>
          <li className="nav-item mb-3">
            <button className="btn btn-outline-light w-100 text-start" onClick={handleSeeScore}>
              See Total Score
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1" style={{ marginLeft: '250px', padding: '20px' }}>
        <div className="row">
          <div className="col-12">
            <div style={{ 
              backgroundColor: '#2c3e50', 
              color: 'white', 
              padding: '25px', 
              borderRadius: '15px', 
              marginBottom: '30px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h1 style={{ margin: 0, fontWeight: 'bold', fontSize: '2.5rem' }}>
                AI Proctor Dashboard
              </h1>
              <p style={{ margin: '10px 0 0 0', fontSize: '1.1rem', opacity: 0.9 }}>
                Real-time monitoring and analytics for online examinations
              </p>
            </div>
          </div>

          {/* Student with Most Alerts Section */}
          {studentWithMostAlerts && studentWithMostAlerts.counts.total > 0 && (
            <div className="col-12 mb-4">
              <div style={{ 
                backgroundColor: '#dd5361ff', 
                color: 'white', 
                padding: '25px', 
                borderRadius: '15px',
                boxShadow: '0 8px 16px rgba(221, 83, 97, 0.3)',
                border: '3px solid #dd5361ff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
                  ⚠️ HIGHEST ALERT STUDENT ⚠️
                </div>
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {studentWithMostAlerts.username} ({studentWithMostAlerts.student})
                </div>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '15px',
                  borderRadius: '10px',
                  display: 'inline-block'
                }}>
                  {studentWithMostAlerts.counts.total} Total Alerts
                </div>
                <div style={{ fontSize: '1.1rem', opacity: 0.95, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' }}>
                  {studentWithMostAlerts.counts.left > 0 && <div>👈 Left: {studentWithMostAlerts.counts.left}</div>}
                  {studentWithMostAlerts.counts.right > 0 && <div>👉 Right: {studentWithMostAlerts.counts.right}</div>}
                  {studentWithMostAlerts.counts.up > 0 && <div>👆 Up: {studentWithMostAlerts.counts.up}</div>}
                  {studentWithMostAlerts.counts.down > 0 && <div>👇 Down: {studentWithMostAlerts.counts.down}</div>}
                  {studentWithMostAlerts.counts.tilt > 0 && <div>🔄 Tilt: {studentWithMostAlerts.counts.tilt}</div>}
                  {studentWithMostAlerts.counts.audio > 0 && <div>🔊 Audio: {studentWithMostAlerts.counts.audio}</div>}
                  {studentWithMostAlerts.counts.faceMismatch > 0 && <div>😕 Face Mismatch: {studentWithMostAlerts.counts.faceMismatch}</div>}
                  {studentWithMostAlerts.counts.multipleFaces > 0 && <div>👥 Multiple Faces: {studentWithMostAlerts.counts.multipleFaces}</div>}
                  {studentWithMostAlerts.counts.noFace > 0 && <div>🚫 No Face: {studentWithMostAlerts.counts.noFace}</div>}
                  {studentWithMostAlerts.counts.forbiddenObject > 0 && <div>📱 Forbidden Object: {studentWithMostAlerts.counts.forbiddenObject}</div>}
                  {studentWithMostAlerts.counts.tabSwitch > 0 && <div>🔄 Tab Switch: {studentWithMostAlerts.counts.tabSwitch}</div>}
                </div>
              </div>
            </div>
          )}
          
          {/* Chart Section */}
          <div className="col-12 mb-5">
            <div style={{ 
              backgroundColor: 'white', 
              padding: '25px', 
              borderRadius: '15px', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #e9ecef'
            }}>
              <h4 style={{ color: '#2c3e50', fontWeight: 'bold', marginBottom: '20px', fontSize: '1.5rem' }}>
                📊 Alerts per Student
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={alertBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="student" tick={{ fill: '#6c757d' }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6c757d' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #dee2e6',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="alerts" fill="#8884d8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student Cards Section */}
          <div className="col-12">
            <div style={{ 
              backgroundColor: 'white', 
              padding: '25px', 
              borderRadius: '15px', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #e9ecef',
              marginBottom: '30px'
            }}>
              <h4 style={{ color: '#2c3e50', fontWeight: 'bold', marginBottom: '20px', fontSize: '1.5rem' }}>
                👥 Student Alert Details
              </h4>
              <input 
                type="text" 
                placeholder="🔍 Search by student roll no or name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control mb-4"
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '2px solid #e9ecef',
                  fontSize: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  maxWidth: '400px'
                }}
              />
              <div className="row">
                {alertData
                  .filter(({ student, username }) => 
                    student.toLowerCase().includes(search.toLowerCase()) ||
                    username.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(({ student, username, counts, score }) => {
                  const hasAlerts = counts.total > 0;
                  const cardColor = hasAlerts ? '#f8d7da' : '#d4edda';
                  const borderColor = hasAlerts ? '#f5c6cb' : '#c3e6cb';
                  
                  return (
                    <div key={student} className="col-md-6 col-lg-4 mb-4">
                      <div style={{ 
                        backgroundColor: cardColor, 
                        padding: '20px', 
                        borderRadius: '15px',
                        border: `2px solid ${borderColor}`,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ 
                          fontSize: '1.3rem', 
                          fontWeight: 'bold', 
                          color: hasAlerts ? '#721c24' : '#155724',
                          marginBottom: '10px',
                          textAlign: 'center'
                        }}>
                          {username}
                        </div>
                        
                        <div style={{ 
                          fontSize: '1rem', 
                          color: hasAlerts ? '#721c24' : '#155724',
                          marginBottom: '15px',
                          textAlign: 'center',
                          fontWeight: '600'
                        }}>
                          Roll No: {student}
                        </div>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '15px',
                          padding: '10px',
                          backgroundColor: 'rgba(255,255,255,0.5)',
                          borderRadius: '8px'
                        }}>
                          <span style={{ fontWeight: 'bold' }}>Score:</span>
                          <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{score}/10</span>
                        </div>
                        
                        <div style={{ 
                          fontSize: '1.8rem', 
                          fontWeight: 'bold', 
                          color: hasAlerts ? '#dc3545' : '#28a745',
                          textAlign: 'center',
                          marginBottom: '15px',
                          padding: '10px',
                          backgroundColor: 'rgba(255,255,255,0.6)',
                          borderRadius: '8px'
                        }}>
                          {hasAlerts ? '⚠️' : '✅'} {counts.total} Alert{counts.total !== 1 ? 's' : ''}
                        </div>
                        
                        {hasAlerts && (
                          <div style={{ fontSize: '0.9rem' }}>
                            {renderAlertBreakdown(counts)}
                          </div>
                        )}

                        {!hasAlerts && (
                          <div style={{
                            textAlign: 'center',
                            padding: '15px',
                            backgroundColor: 'rgba(255,255,255,0.5)',
                            borderRadius: '8px',
                            color: '#155724',
                            fontWeight: '600'
                          }}>
                            ✨ Clean Exam - No Violations Detected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {alertData.filter(({ student, username }) => 
                student.toLowerCase().includes(search.toLowerCase()) ||
                username.toLowerCase().includes(search.toLowerCase())
              ).length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6c757d',
                  fontSize: '1.2rem'
                }}>
                  No students found matching "{search}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}