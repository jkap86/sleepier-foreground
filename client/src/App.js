import './App.css';
import { useState } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('')
  const [season, setSeason] = useState('')


  const search = async () => {
    const data = await axios.post('/user/create', {
      username: username
    })
    if (data.data?.error) {
      console.log('ERROR!!!')
    } else {
      const leagues = await axios.post('/league/create', {
        user_id: data.data[0]?.user_id.toString(),
        season: season
      })
      console.log(leagues.data)
    }
  }

  return (
    <div className="App">
      <input onBlur={(e) => setUsername(e.target.value)} />
      <input onBlur={(e) => setSeason(e.target.value)} />
      <button type='submit' onClick={() => search()}>Submit</button>
    </div>
  );
}

export default App;
