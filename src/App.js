import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Exam from './components/Exam';
import Instruction from './components/Instruction';
import NotFound from './components/NotFound';
import ProctorDashboard from './pages/ProctorDashboard';
import Register from './components/Register';
import Scores from './components/Scores';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/exam' element={<Exam />} />
          <Route path='/instruction' element={<Instruction />} />
          <Route path='/scores' element={<Scores />} />
          <Route path="/proctor-dashboard" element={<ProctorDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}
export default App;