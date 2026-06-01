import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import API_URL from "../config";

export default function Exam() {
  const examRef = useRef(null);
  const navigate = useNavigate();

  
  // 1. Define questions FIRST
  const questions = useMemo(() => [
  {
    questionText: 'What does HTML stand for?',
    answerOptions: [
      { answerText: 'Hyper Trainer Marking Language', isCorrect: false },
      { answerText: 'Hyper Text Markup Language', isCorrect: true },
      { answerText: 'Hyper Text Making Links', isCorrect: false },
      { answerText: 'Hyper Text Machine Language', isCorrect: false },
    ],
  },
  {
    questionText: 'Which tag is used to display an image in HTML?',
    answerOptions: [
      { answerText: '<img>', isCorrect: true },
      { answerText: '<image>', isCorrect: false },
      { answerText: '<src>', isCorrect: false },
      { answerText: '<pic>', isCorrect: false },
    ],
  },
  {
    questionText: 'Which symbol is used for comments in JavaScript?',
    answerOptions: [
      { answerText: '//', isCorrect: true },
      { answerText: '/* */', isCorrect: false },
      { answerText: '<!-- -->', isCorrect: false },
      { answerText: '#', isCorrect: false },
    ],
  },
  {
    questionText: 'Which of the following is used to add style to a webpage?',
    answerOptions: [
      { answerText: 'HTML', isCorrect: false },
      { answerText: 'CSS', isCorrect: true },
      { answerText: 'Python', isCorrect: false },
      { answerText: 'SQL', isCorrect: false },
    ],
  },
  {
    questionText: 'Which tag is used to create a link in HTML?',
    answerOptions: [
      { answerText: '<a>', isCorrect: true },
      { answerText: '<link>', isCorrect: false },
      { answerText: '<href>', isCorrect: false },
      { answerText: '<url>', isCorrect: false },
    ],
  },
  {
    questionText: 'Which keyword is used to declare a variable in JavaScript?',
    answerOptions: [
      { answerText: 'var', isCorrect: true },
      { answerText: 'variable', isCorrect: false },
      { answerText: 'int', isCorrect: false },
      { answerText: 'letvar', isCorrect: false },
    ],
  },
  {
    questionText: 'What does CSS stand for?',
    answerOptions: [
      { answerText: 'Creative Style Sheets', isCorrect: false },
      { answerText: 'Cascading Style Sheets', isCorrect: true },
      { answerText: 'Computer Style Syntax', isCorrect: false },
      { answerText: 'Colorful Style System', isCorrect: false },
    ],
  },
  {
    questionText: 'Which of the following is a programming language?',
    answerOptions: [
      { answerText: 'HTML', isCorrect: false },
      { answerText: 'CSS', isCorrect: false },
      { answerText: 'Python', isCorrect: true },
      { answerText: 'Photoshop', isCorrect: false },
    ],
  },
  {
    questionText: 'Which of the following shows an alert box in JavaScript?',
    answerOptions: [
      { answerText: 'alert()', isCorrect: true },
      { answerText: 'show()', isCorrect: false },
      { answerText: 'display()', isCorrect: false },
      { answerText: 'popup()', isCorrect: false },
    ],
  },
  {
    questionText: 'Which HTML tag is used to display a table?',
    answerOptions: [
      { answerText: '<table>', isCorrect: true },
      { answerText: '<tab>', isCorrect: false },
      { answerText: '<tbl>', isCorrect: false },
      { answerText: '<tr>', isCorrect: false },
    ],
  },
], []);

  // 2. Now you can use questions in your hooks
  const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(null));
  const [score, setScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [headAlert, setHeadAlert] = useState("");
  const webcamRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [objectDetectionStatus, setObjectDetectionStatus] = useState("");
  const [studentId, setStudentId] = useState(null);

  const [audioAlert, setAudioAlert] = useState("");

  const rollNumber = localStorage.getItem("rollNumber");

  // Helper function to log alerts to backend
  const logAlertToBackend = useCallback((direction, details = {}) => {
    if (!studentId) {
      console.error("Cannot log alert: Student ID not available");
      return;
    }

    const alertData = {
      student_id: studentId,
      direction: direction,
      time: new Date().toLocaleTimeString(),
      ...details
    };

    console.log("Logging alert:", alertData);

    fetch(`${API_URL}/log-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    })
    .then(res => res.json())
    .then(logData => {
      console.log("Alert logged successfully:", logData);
    })
    .catch(err => {
      console.error("Error logging alert:", err);
    });
  }, [studentId]);

  // Fetch student ID on component mount
  useEffect(() => {
    if (rollNumber) {
      fetch(`${API_URL}/get-student-id/${rollNumber}`)
        .then(res => res.json())
        .then(data => {
          if (data.student_id) {
            setStudentId(data.student_id);
            console.log("Student ID fetched:", data.student_id);
          } else {
            console.error("Student ID not found");
          }
        })
        .catch(err => {
          console.error("Error fetching student ID:", err);
        });
    }
  }, [rollNumber]);

  // Memoized handleSubmit to avoid useEffect warning
  const handleSubmit = useCallback(() => {
        let newScore = 0;
        userAnswers.forEach((ansIdx, qIdx) => {
            if (
                ansIdx !== null &&
                questions[qIdx].answerOptions[ansIdx].isCorrect
            ) {
                newScore += 1;
            }
        });
        setScore(newScore);
        setSubmitted(true);

        // Send score to backend
        fetch(`${API_URL}/submit-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                rollNumber: rollNumber,
                score: newScore
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Score submitted successfully:", data);
        })
        .catch(err => {
            console.error("Error submitting score:", err);
        });
    }, [userAnswers, questions, rollNumber]);

  const handleStartExam = async () => {
    setRegisterError("");
    setRegistering(true);
    const face = webcamRef.current.getScreenshot();
    if (!face) {
      setRegisterError("Could not capture image from webcam.");
      setRegistering(false);
      return;
    }

    // Convert dataURL to Blob
    const blob = await fetch(face).then(res => res.blob());
    const formData = new FormData();
    formData.append("roll_number", rollNumber);
    formData.append("image", blob, "face.jpg");

    // Register face
    const res = await fetch(`${API_URL}/register-face`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.status === "registered") {
      if (examRef.current && document.fullscreenEnabled) {
        await examRef.current.requestFullscreen();
      }
      setStarted(true);
    } else if (data.status === "no_face") {
      setRegisterError("No face detected. Please ensure your face is visible and try again.");
    } else if (data.status === "multiple_faces") {
      setRegisterError("Multiple faces detected. Please ensure only you are visible and try again.");
    } else if (data.status === "poor_quality") {
      setRegisterError(`Face image quality issue: ${data.message}. Please ensure good lighting and a clear view of your face.`);
    } else {
      setRegisterError("Face registration failed. Please try again.");
    }
    setRegistering(false);
  };

  // Now useEffect can safely use handleSubmit
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement && started && !submitted) {
        handleSubmit();
        alert("You exited fullscreen. Exam submitted automatically.");
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [started, submitted, handleSubmit]);

  const verifyFaceDuringExam = useCallback(async (dataUrl) => {
    try {
      const blob = await fetch(dataUrl).then(res => res.blob());
      const formData = new FormData();
      formData.append("roll_number", rollNumber);
      formData.append("image", blob, "frame.jpg");

      const res = await fetch(`${API_URL}/verify-face`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "mismatch") {
        // Log face mismatch alert
        logAlertToBackend("ALERT: Face Mismatch Detected", {
          description: "Different person detected during exam"
        });

        const shouldSubmit = window.confirm(
          "Warning: Face mismatch detected! This might be due to lighting or angle changes. " +
          "Please ensure you are the same person who registered. " +
          "Click OK to submit the exam, or Cancel to continue."
        );
        if (shouldSubmit) {
          handleSubmit();
        }
      } else if (data.status === "multiple_faces") {
        // Log multiple faces alert
        logAlertToBackend("ALERT: Multiple Faces Detected", {
          description: "More than one person detected in frame"
        });
        alert("Multiple faces detected! Please ensure only you are visible.");
      } else if (data.status === "no_face") {
        // Log no face alert
        logAlertToBackend("ALERT: No Face Detected", {
          description: "Student not visible in frame"
        });
        console.log("No face detected in current frame");
      }
    } catch (error) {
      console.error("Face verification error:", error);
    }
  }, [rollNumber, handleSubmit, logAlertToBackend]);

  const detectObjectDuringExam = useCallback(async (dataUrl) => {
    try {
      const blob = await fetch(dataUrl).then(res => res.blob());
      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");

      const res = await fetch(`${API_URL}/detect-object`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      setObjectDetectionStatus(`Last check: ${data.status}`);

      if (data.status === "forbidden_object") {
        // Log forbidden object alert
        logAlertToBackend("ALERT: Forbidden Object Detected", {
          description: `Detected objects: ${data.objects?.join(', ')}`,
          objects: data.objects
        });

        alert(`Forbidden object detected: ${data.objects?.join(', ')}. Exam will be submitted.`);
        handleSubmit();
      }
    } catch (error) {
      console.error("Object detection error:", error);
    }
  }, [handleSubmit, logAlertToBackend]);

  const sendFrameToBackend = useCallback((dataUrl) => {
    if (!studentId) {
      console.error("Student ID not available yet");
      return;
    }

    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'frame.jpg');
        fetch(`${API_URL}/detect-head`, {
          method: "POST",
          body: formData,
        })
        .then(res => res.json())
        .then(data => {
          setHeadAlert(data.direction);
          if (data.direction.startsWith("ALERT")) {
            // Use the helper function to log alert
            logAlertToBackend(data.direction, {
              yaw: data.yaw,
              pitch: data.pitch,
              roll: data.roll
            });
          }
        })
        .catch(err => {
          console.error("Error detecting head:", err);
        });
      })
      .catch(err => {
        console.error("Error converting image:", err);
      });
  }, [studentId, logAlertToBackend]);

  // Timer logic
  useEffect(() => {
      if (!submitted && timeLeft > 0) {
          const timer = setTimeout(() => {
              setTimeLeft(timeLeft - 1);
          }, 1000);
          return () => clearTimeout(timer);
      }
      if (timeLeft === 0 && !submitted) {
          handleSubmit();
      }
  }, [timeLeft, submitted, handleSubmit]);

  // Head movement detection logic
  useEffect(() => {
      if (!started || submitted || !studentId) return;
      const interval = setInterval(() => {
          if (webcamRef.current) {
              const imageSrc = webcamRef.current.getScreenshot();
              if (imageSrc) {
                  sendFrameToBackend(imageSrc);
              }
          }
      }, 2000);
      return () => clearInterval(interval);
  }, [started, submitted, studentId, sendFrameToBackend]);

  // Face verification logic (separate from head movement, less frequent)
  useEffect(() => {
      if (!started || submitted) return;
      const interval = setInterval(() => {
          if (webcamRef.current) {
              const imageSrc = webcamRef.current.getScreenshot();
              if (imageSrc) {
                  verifyFaceDuringExam(imageSrc);
              }
          }
      }, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
  }, [started, submitted, verifyFaceDuringExam]);

  // Object detection logic
  useEffect(() => {
      if (!started || submitted) return;
      const interval = setInterval(() => {
          if (webcamRef.current) {
              const imageSrc = webcamRef.current.getScreenshot();
              if (imageSrc) {
                  detectObjectDuringExam(imageSrc);
              }
          }
      }, 3000); // Check every 3 seconds
      return () => clearInterval(interval);
  }, [started, submitted, detectObjectDuringExam]);


  // Voice detection logic
  useEffect(() => {
    if (!started || submitted) return;

    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;
    let multiVoiceDetected = false;
    let voiceAlertCount = 0;

    const detectVoices = (dataArray) => {
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      let average = sum / dataArray.length;
      return average > 40 ? 2 : 1;
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = function () {
          let array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);

          let voices = detectVoices(array);

          if (voices > 1 && !multiVoiceDetected) {
            multiVoiceDetected = true;
            voiceAlertCount += 1;

            if (voiceAlertCount < 3) {
              setAudioAlert(`⚠️ Multiple voices detected! (${voiceAlertCount}/3) Please ensure a quiet environment.`);
            } else {
              setAudioAlert("⚠️ Multiple voices detected 3 times! Exam will be submitted automatically.");
              setTimeout(() => handleSubmit(), 2000);
            }

            // Log audio alert using the helper function
            logAlertToBackend("ALERT: Multiple Voices Detected", {
              description: `Multiple voices detected (${voiceAlertCount}/3)`,
              count: voiceAlertCount
            });

            // Clear alert after 5 seconds and allow re-detection
            setTimeout(() => {
              setAudioAlert("");
              multiVoiceDetected = false;
            }, 5000);
          }
        };
      })
      .catch(err => {
        setAudioAlert("Microphone access denied or error: " + err.message);
      });

    return () => {
      if (javascriptNode) javascriptNode.disconnect();
      if (analyser) analyser.disconnect();
      if (microphone) microphone.disconnect();
      if (audioContext) audioContext.close();
    };
  }, [started, submitted, handleSubmit, studentId, logAlertToBackend]);


  // Disable copy/paste functionality during exam
  useEffect(() => {
    const handleCopyPaste = (e) => {
      e.preventDefault();
      alert("Copy/paste is disabled during the exam!");
    };

    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);

    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
    };
  }, []);

  // Disable tab switching during exam
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && started && !submitted) {
        // Log tab switch alert
        logAlertToBackend("ALERT: Tab Switch Detected", {
          description: "Student switched tabs during exam"
        });
        alert("Warning: Tab switching is not allowed during the exam! Returning to exam.");
        window.focus();
      }
    };

    const handleBeforeUnload = (e) => {
      if (started && !submitted) {
        e.preventDefault();
        e.returnValue = "Warning: You cannot leave the exam page!";
        return "Warning: You cannot leave the exam page!";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [started, submitted, logAlertToBackend]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={examRef} style={{ 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header Warning */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '2px solid #ffeaa7',
        color: '#856404',
        padding: '15px',
        textAlign: 'center',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        Warning: Do not exit fullscreen mode. You are being monitored by AI proctoring.
      </div>

      {!started ? (
        // Pre-exam setup
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '70vh',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h1 style={{
              color: '#2c3e50',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '30px'
            }}>
              Online Examination
            </h1>
            
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={320}
              height={240}
              style={{
                borderRadius: '15px',
                border: '3px solid #e9ecef',
                marginBottom: '20px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
              }}
            />
            
            {registerError && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '1px solid #f5c6cb'
              }}>
                Warning: {registerError}
              </div>
            )}


            {audioAlert && (
            <div style={{
             fontSize: '1.1rem',
            color: '#b71c1c',
            backgroundColor: '#ffeaea',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #f44336',
            marginBottom: '10px',
            width: '100%',
            textAlign: 'center'
            }}>
            {audioAlert}
            </div>
            )}

            
            <button 
              onClick={handleStartExam} 
              disabled={registering}
              style={{
                backgroundColor: registering ? '#95a5a6' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '10px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: registering ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)'
              }}
            >
              {registering ? "Registering..." : "Start Exam"}
            </button>
          </div>
        </div>
      ) : (
        // Exam interface
        <div style={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
          {/* Left: Questions */}
          <div style={{
            flex: '2',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '15px',
            margin: '0 10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            overflowY: 'auto'
          }}>
            {/* Timer and Progress */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
              padding: '20px',
              backgroundColor: '#e3f2fd',
              borderRadius: '10px',
              border: '2px solid #2196f3'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: timeLeft < 60 ? '#f44336' : '#1976d2'
              }}>
                Time Left: {formatTime(timeLeft)}
              </div>
              <div style={{
                backgroundColor: '#ff9800',
                color: 'white',
                padding: '8px 15px',
                borderRadius: '20px',
                fontWeight: 'bold'
              }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>

            {!submitted ? (
              <>
                {/* Current Question */}
                <div style={{
                  backgroundColor: '#fafafa',
                  padding: '30px',
                  borderRadius: '15px',
                  border: '2px solid #e0e0e0',
                  marginBottom: '30px'
                }}>
                  <h3 style={{
                    color: '#2c3e50',
                    fontSize: '1.3rem',
                    marginBottom: '25px',
                    fontWeight: '600'
                  }}>
                    {questions[currentQuestionIndex].questionText}
                  </h3>
                  
                  {questions[currentQuestionIndex].answerOptions.map((option, oIdx) => (
                    <div key={oIdx} style={{ marginBottom: '15px' }}>
                      <input
                        type="radio"
                        id={`q${currentQuestionIndex}-o${oIdx}`}
                        name={`question-${currentQuestionIndex}`}
                        value={oIdx}
                        checked={userAnswers[currentQuestionIndex] === oIdx}
                        onChange={() => {
                          const updated = [...userAnswers];
                          updated[currentQuestionIndex] = oIdx;
                          setUserAnswers(updated);
                        }}
                        style={{
                          marginRight: '12px',
                          transform: 'scale(1.2)'
                        }}
                      />
                      <label 
                        htmlFor={`q${currentQuestionIndex}-o${oIdx}`}
                        style={{
                          color: '#34495e',
                          fontSize: '1.1rem',
                          cursor: 'pointer',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          backgroundColor: userAnswers[currentQuestionIndex] === oIdx ? '#e8f5e8' : 'transparent',
                          border: userAnswers[currentQuestionIndex] === oIdx ? '2px solid #4caf50' : '1px solid #ddd',
                          transition: 'all 0.3s ease',
                          display: 'inline-block',
                          minWidth: '200px'
                        }}
                      >
                        {option.answerText}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                {/* Navigation */}
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px'
}}>
  <button 
    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
    disabled={currentQuestionIndex === 0}
    style={{
      backgroundColor: currentQuestionIndex === 0 ? '#95a5a6' : '#17a2b8',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
    }}
  >
    Previous
  </button>
  
  <span style={{
    backgroundColor: '#6f42c1',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '20px',
    fontWeight: 'bold'
  }}>
    {currentQuestionIndex + 1} / {questions.length}
  </span>
  
  <button 
    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
    disabled={currentQuestionIndex === questions.length - 1}
    style={{
      backgroundColor: currentQuestionIndex === questions.length - 1 ? '#95a5a6' : '#28a745',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: currentQuestionIndex === questions.length - 1 ? 'not-allowed' : 'pointer'
    }}
  >
    Next
  </button>
</div>

                {/* Submit Button */}
                {currentQuestionIndex === questions.length - 1 && (
                  <button 
                    onClick={handleSubmit}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '10px',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 5px 15px rgba(220, 53, 69, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Submit Exam
                  </button>
                )}
              </>
            ) : (
              // Results
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#e8f5e8',
                borderRadius: '15px',
                border: '3px solid #4caf50'
              }}>
                <h2 style={{
                  color: '#2e7d32',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  marginBottom: '20px'
                }}>
                  Exam Completed!
                </h2>
                <div style={{
                  fontSize: '2rem',
                  color: '#1976d2',
                  fontWeight: 'bold',
                  marginBottom: '20px'
                }}>
                  Your Score: <span style={{ color: '#4caf50', fontSize: '3rem' }}>{score}</span> / <span style={{ color: '#ff9800' }}>{questions.length}</span>
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  color: '#666',
                  marginBottom: '30px'
                }}>
                  Percentage: <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{Math.round((score / questions.length) * 100)}%</span>
                </div>
                <button 
                  onClick={() => navigate('/proctor-dashboard')}
                  style={{
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    borderRadius: '10px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Go to Proctor Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Right: Webcam and Alerts */}
          <div style={{
            flex: '1',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '15px',
            margin: '0 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              backgroundColor: '#2c3e50',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '100%'
            }}>
              AI Proctoring Active
            </div>
            
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={320}
              height={240}
              style={{
                borderRadius: '15px',
                border: '3px solid #e9ecef',
                marginBottom: '20px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
              }}
            />
            
            {headAlert && (
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: headAlert.startsWith("ALERT") ? "#dc3545" : "#28a745",
                textAlign: 'center',
                padding: '15px',
                borderRadius: '10px',
                backgroundColor: headAlert.startsWith("ALERT") ? '#f8d7da' : '#d4edda',
                border: `2px solid ${headAlert.startsWith("ALERT") ? '#f5c6cb' : '#c3e6cb'}`,
                marginBottom: '15px',
                width: '100%'
              }}>
                {headAlert}
              </div>
            )}
            
            {objectDetectionStatus && (
              <div style={{
                fontSize: '1rem',
                color: '#6c757d',
                textAlign: 'center',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                width: '100%'
              }}>
                {objectDetectionStatus}
              </div>
            )}

            {audioAlert && (
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#b71c1c',
                backgroundColor: '#ffeaea',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #f44336',
                marginTop: '10px',
                textAlign: 'center',
                width: '100%'
              }}>
                {audioAlert}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}