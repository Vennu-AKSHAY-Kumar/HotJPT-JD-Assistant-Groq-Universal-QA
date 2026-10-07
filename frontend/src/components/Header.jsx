function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          H
        </div>
        <div>
          <strong>JD Assistant</strong>
          <span>by HotJPT</span>
        </div>
      </div>

      <div className="header-note">
        Groq-powered Interview Assistant
      </div>
    </header>
  );
}

export default Header;
