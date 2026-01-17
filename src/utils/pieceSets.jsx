import React from 'react';

export const PIECE_SETS = [
    { id: 'cburnett', name: 'Classic (Standard)' },
    { id: 'merida', name: 'Merida' },
    { id: 'alpha', name: 'Alpha' },
    { id: 'pixel', name: 'Pixel' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'spatial', name: 'Spatial' },
];

const pieceMap = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];

export const getCustomPieces = (pieceSet = 'cburnett') => {
    console.log('[getCustomPieces] Generating pieces for set:', pieceSet);
    const pieces = {};

    pieceMap.forEach((p) => {
        pieces[p] = ({ squareWidth }) => (
            <img
                src={`https://assets.lichess1.org/piece/${pieceSet}/${p}.svg`}
                alt={p}
                style={{
                    width: squareWidth,
                    height: squareWidth,
                    display: 'block',
                }}
            />
        );
    });

    return pieces;
};
