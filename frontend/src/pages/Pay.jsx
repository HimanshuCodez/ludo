import { useEffect } from "react";
import { Header } from "../Components/Header";
import axios from 'axios'
import { useState } from 'react'
import { Footer } from "../Components/Footer";

export function Pay() {
    const [qr, setQr] = useState({});

    useEffect(() => {
        axios.post(`https://8f54vp0d-3000.inc1.devtunnels.ms/QR`, {
            Amount: window.localStorage.getItem("Amount")
        }).then((res) => {
            setQr(res.data.qr);
        }).catch((err) => {
            console.error(err);
        })
    }, [])

    return <div>
        <Header></Header>
        <div className="p-10 text-white text-4xl box-border">
            <div className="text-center mb-5 font-roboto">Pay Now</div>
            <div className="flex items-center justify-center">
                {qr && <img src={qr} className="size-70"></img>}
            </div>
        </div>
        <Footer></Footer>
    </div>
}