export type PieceColor = 'white' | 'black';

export interface ChessMove {
  from: string;
  to: string;
  piece: string;
  color: PieceColor;
}

export const createMove = (from: string, to: string, piece: string, color: PieceColor): ChessMove => ({
  from,
  to,
  piece,
  color,
});
