import { api } from "../api/client";
import logo from "../assets/logo.png";

export function LoginScreen() {
  return (
    <div className="screen">
      <h1 className="login-logo">
        <img src={logo} alt="Sometime Fitness" />
      </h1>
      <p>3分だけ、体を動かそう</p>
      <button className="primary" onClick={api.loginWithGoogle}>
        Googleではじめる
      </button>
    </div>
  );
}
