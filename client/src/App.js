import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './components/Home/homepage';
import Main from './components/Home/main';
import Playoffs from './components/Playoffs/playoffs_2022';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Homepage />} />
          <Route path='/:username/:season' element={<Main />} />
          <Route path='/playoffs/:league_id' element={<Playoffs />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
