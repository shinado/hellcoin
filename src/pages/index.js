import { Toaster } from "react-hot-toast";
import Burn from "./burn";
import Navigation from "./navbar";
import SuppressHydrationWarning from "@/components/suppressHydrationWarning";

export default function Home() {
  return (
    <div className="w-full">
      {/* <Navigation /> */}
      <Toaster position="top-right" reverseOrder={false} />
      <div className="absolute" />
      <SuppressHydrationWarning>
        <Burn />
      </SuppressHydrationWarning>
    </div>
  );
}
