import { Footer } from "../Components/Footer";
import { Header } from "../Components/Header";
import notificationImg from "../assets/notifications.png";
import { useState } from "react";

export function Notifications() {
    const [haveNotification, setHaveNotification] = useState(false);

    return <div>
        <Header></Header>
        <div className="font-roboto text-[20px] mt-4 p-4 text-white">
            <div>Notifications</div>
            <div className="flex items-center justify-center p-4 border-1 border-solid border-black rounded-lg mt-4 bg-blue-300">
                {!haveNotification ?
                    <div>
                        <img src={notificationImg} className="w-full h-full"></img>
                        <div className="flex justify-center items-center text-black font-semibold">No notifications yet!</div>
                    </div> :
                    <div>You have Notifications</div>}
            </div>
        </div>
        <Footer></Footer>
    </div>
}