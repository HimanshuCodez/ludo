import React from 'react'

import WinApprove from './WinApprove'
import WithdrawAdmin from './AdminWithdraw'
import AdminKycApprove from './AdminKycApprove'

const Dashboard = () => {
  return (
    <div>
        <WinApprove/>
        <WithdrawAdmin/>
       <AdminKycApprove/>
        
    </div>
  )
}

export default Dashboard