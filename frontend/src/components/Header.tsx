import { Link } from "react-router";
import { useAuth } from "../context/authContext";

function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-white p-4 shadow-xl flex justify-between items-center">
      <Link
        to="/"
        className="text-xl flex items-center gap-2 hover:text-hover-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:ring-white"
      >
        <img src="/sana-logo-white.png" alt="sana logo" className="size-10" />
        <span className="sr-only">SANA Web Interface home</span>
      </Link>
      <nav className="flex space-x-8" aria-label="Main navigation">
        <Link 
          to="/submit-job" 
          className="hover:text-hover-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:ring-white"
        >
          Submit New Job
        </Link>
        <Link 
          to="/lookup-job" 
          className="hover:text-hover-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:ring-white"
        >
          Lookup Previous Job
        </Link>
        <Link 
          to="/contact" 
          className="hover:text-hover-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:ring-white"
        >
          Contact Us
        </Link>
        {user ? (
                      <Link 
                        to="/dashboard" 
                        className="hover:text-hover-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:ring-white"
                      >
                      Dashboard
                    </Link>
        )
                    : (
                      <>
                        <Link 
                          to="/login" 
                          className="hover:text-hover-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:ring-white"
                        >
                          Login
                        </Link>
                        {/* <Link to="/register" className="hover:text-hover-link transition">
                          Register
                        </Link> */}
                      </>
                    )}
      </nav>
    </header>
  );
}

export default Header;
