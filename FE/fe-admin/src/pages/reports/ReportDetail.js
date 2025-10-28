import React from 'react';

const ReportDetail = () => {
  return (
    <div className="report-detail">
      <h1>Report Detail</h1>
      <div className="report-info">
        <p>Report ID: 1</p>
        <p>Reporter: user1</p>
        <p>Reported User: user2</p>
        <p>Reason: Inappropriate behavior</p>
        <p>Description: User was sending inappropriate messages</p>
        <p>Status: Pending</p>
        <p>Date: 2024-01-15</p>
      </div>
    </div>
  );
};

export default ReportDetail;
