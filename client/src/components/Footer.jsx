export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">&copy; {new Date().getFullYear()} HabiTrek Private Limited</div>

        <div className="footer-socials">
          <a href="#" aria-label="Instagram" id="footer-instagram">
            <i className="fa-brands fa-square-instagram"></i>
          </a>
          <a href="#" aria-label="LinkedIn" id="footer-linkedin">
            <i className="fa-brands fa-linkedin"></i>
          </a>
          <a href="#" aria-label="Facebook" id="footer-facebook">
            <i className="fa-brands fa-square-facebook"></i>
          </a>
        </div>

        <div className="footer-links">
          <a href="/privacy" id="footer-privacy">Privacy</a>
          <a href="/terms" id="footer-terms">Terms</a>
        </div>
      </div>
    </footer>
  );
}
