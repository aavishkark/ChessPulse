import './PromotionDialog.css';

export default function PromotionDialog({ color, onSelect }) {
    const pieces = ['q', 'r', 'b', 'n'];
    const pieceNames = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' };

    return (
        <div className="promotion-overlay">
            <div className="promotion-dialog">
                <h3>Choose Promotion Piece</h3>
                <div className="promotion-pieces">
                    {pieces.map(piece => (
                        <button
                            key={piece}
                            className="promotion-piece-btn"
                            onClick={() => onSelect(piece)}
                        >
                            <span className="piece-symbol">
                                {color === 'white' ?
                                    { q: '♕', r: '♖', b: '♗', n: '♘' }[piece] :
                                    { q: '♛', r: '♜', b: '♝', n: '♞' }[piece]
                                }
                            </span>
                            <span className="piece-name">{pieceNames[piece]}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
