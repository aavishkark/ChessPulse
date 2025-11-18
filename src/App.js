import './App.css';
import getTournaments from './actions';
function App() {
  const gamelink = "4tNo74ff";
  getTournaments();
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <input type="text" placeholder="Enter text here" />
          <button>Submit</button>
        </div>
      </header>
    </div>
  );
}

export default App;
