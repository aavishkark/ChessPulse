import './footer.css';

export const Footer = () => {
    return (
        <footer className="footer-modern">
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="footer-logo gradient-text">ChessPulse</span>
                    </div>

                    <nav className="footer-nav">
                        <a href="/">Home</a>
                        <a href="/tournaments">Tournaments</a>
                        <a href="/rankings">Rankings</a>
                    </nav>

                    <div className="footer-copyright">
                        <span>© {new Date().getFullYear()} ChessPulse. Made with <span className="heart">♥</span></span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
