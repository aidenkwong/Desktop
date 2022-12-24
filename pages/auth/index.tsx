import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import Router from "next/router";
import { useContext } from "react";
import { firebaseApp } from "../../firebase/firebase";
import { UserUpdateContext } from "../../provider/UserProvider";

const provider = new GoogleAuthProvider();
const auth = getAuth(firebaseApp);

const Auth = () => {
  // useContext
  const updateUser = useContext(UserUpdateContext);

  // functions
  const signIn = async () => {
    const { user } = await signInWithPopup(auth, provider);

    updateUser(user);
    Router.push("/");
  };

  return (
    <div className="grid h-screen place-items-center">
      <div className="h-72">
        <button onClick={signIn}>Sign in with Google</button>
      </div>
    </div>
  );
};

export default Auth;
