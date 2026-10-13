import { PulseBrandMark } from '../Icons/Icons';
import './chess-loader.css';

export default function ChessLoader({ text = 'Loading...' }) {
    return (
        <div className="chess-loader-container">
            <div className="chess-loader-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--arena-accent, #a855f7)' }}>
                <PulseBrandMark size={52} />
            </div>
            {text && <p className="chess-loader-text">{text}</p>}
        </div>
    );
}
