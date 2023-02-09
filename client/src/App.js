import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './components/Home/homepage';
import Main from './components/Home/main';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Homepage />} />
          <Route path='/:username/:season' element={<Main />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
