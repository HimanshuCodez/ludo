
import React from 'react'
import { auth } from '../firebase';
const Dashboard = () => {
  return (
    <div>
      <h1>Welcome to Life Ludo 🧠</h1>
      <button onClick={() => auth.signOut()}>Logout</button>
    </div>
  )
}

export default Dashboard