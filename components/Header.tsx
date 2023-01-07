import { getAuth } from "firebase/auth";
import Router from "next/router";
import { useContext } from "react";
import { firebaseApp } from "../firebase/firebase";
import Image from "next/image";
import { UserContext } from "../provider/UserProvider";
import { ThemeContext } from "../provider/ThemeProvider";

const auth = getAuth(firebaseApp);

const Header = () => {
  // useContext
  const { user, setUser } = useContext(UserContext);
  const { theme, setTheme } = useContext(ThemeContext);

  // functions
  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    Router.push("/auth");
  };

  return (
    <div
      className={`bg-${theme}-400 text-black h-12 justify-between flex content-center px-2`}
    >
      <p className="text-2xl content-center grid">Desktop</p>
      <div className="flex gap-4 align-middle">
        <div className="content-center grid">
          <p>{user?.displayName}</p>
        </div>
        <div className="content-center grid">
          <div className="w-8 h-8">
            <Image
              className="rounded-full"
              src={user?.photoURL!!}
              width={32}
              height={32}
              alt={"user photo"}
            />
          </div>
        </div>

        <button
          className={`content-center grid hover:text-${theme}-800`}
          onClick={signOut}
        >
          sign out
        </button>
      </div>
    </div>
  );
};

export default Header;
