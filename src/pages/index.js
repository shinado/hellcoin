import { Toaster } from "react-hot-toast";
import Burn from "./burn";
import Navigation from "./navbar";

export default function Home() {
  return (
    <div className="w-full">
      {/* <Navigation /> */}
      <Toaster position="top-right" reverseOrder={false} />
      <div className="absolute"/>
      <Burn />
    </div>
  );
}
