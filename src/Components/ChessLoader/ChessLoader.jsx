import loadingImage from '../../assets/loading.png';
import './chess-loader.css';

export default function ChessLoader({ text = 'Loading...' }) {
    return (
        <div className="chess-loader-container">
            <img
                src={loadingImage}
                alt="Loading"
                className="chess-loader-image"
            />
            {text && <p className="chess-loader-text">{text}</p>}
        </div>
    );
}
