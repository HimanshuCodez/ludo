import { Routes, Route, BrowserRouter } from "react-router-dom";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { AddCash } from "./pages/AddCash";
import { Refer } from "./pages/Refer";
import { History } from "./pages/History";
import { MyWallet } from "./pages/MyWallet";
import { Notifications } from "./pages/Notifications";
import { Support } from "./pages/Support";
import { Pay } from "./pages/Pay";
import { Matchmaking } from "./pages/Matchmaking"; // Assuming Matchmaking is in ./pages
import { GameRoom } from "./pages/GameRoom"; // <-- Naya import: GameRoom component ko import karein


function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/Profile' element={<Profile />} />
          <Route path='/AddCash' element={<AddCash />} />
          <Route path='/Refer' element={<Refer />} />
          <Route path='/History' element={<History />} />
          <Route path='/MyWallet' element={<MyWallet />} />
          <Route path='/Notifications' element={<Notifications />} />
          <Route path='/Support' element={<Support />} />
          <Route path='/Pay' element={<Pay />} />
          <Route path='/Matchmaking' element={<Matchmaking />} />
          {/* Naya Route: GameRoom component ke liye dynamic route */}
          <Route path='/room/:roomId' element={<GameRoom />} /> {/* <-- Ye line add karein */}
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;
