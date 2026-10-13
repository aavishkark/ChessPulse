import React from 'react';

export const PIECE_SETS = [
  { id: 'cburnett', name: 'Classic (Staunton)', category: 'Standard' },
  { id: 'merida', name: 'Merida', category: 'Standard' },
  { id: 'alpha', name: 'Alpha', category: 'Standard' },
  { id: 'california', name: 'California', category: 'Classic' },
  { id: 'cardinal', name: 'Cardinal', category: 'Classic' },
  { id: 'dubrovny', name: 'Dubrovny (1950)', category: 'Historic' },
  { id: 'governor', name: 'Governor', category: 'Classic' },
  { id: 'tatiana', name: 'Tatiana', category: 'Elegant' },
  { id: 'pixel', name: 'Pixel 8-Bit', category: 'Retro' },
  { id: 'fantasy', name: 'Fantasy', category: 'Themed' },
  { id: 'spatial', name: 'Spatial Sci-Fi', category: 'Futuristic' },
  { id: 'horsey', name: 'Horsey', category: 'Fun' },
];

export const PIECE_MAP = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];

export const getPieceSvgUrl = (pieceSet = 'cburnett', piece = 'wK') => {
  return `https://lichess1.org/assets/piece/${pieceSet}/${piece}.svg`;
};

export const getCustomPieces = (pieceSet = 'cburnett') => {
  if (!pieceSet || pieceSet === 'cburnett') {
    // Return undefined so react-chessboard falls back to its built-in inline vector defaultPieces
    return undefined;
  }

  const pieces = {};
  PIECE_MAP.forEach((p) => {
    pieces[p] = (props) => (
      <img
        src={`https://lichess1.org/assets/piece/${pieceSet}/${p}.svg`}
        alt={p}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
          ...props?.svgStyle,
        }}
      />
    );
  });

  return pieces;
};
