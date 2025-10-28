import React from 'react';

const ReportsList = () => {
  return (
    <div className="reports-list">
      <h1>Reports Management</h1>
      <div className="reports-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Reporter</th>
              <th>Reported User/Pet</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>user1</td>
              <td>user2</td>
              <td>Inappropriate behavior</td>
              <td>Pending</td>
              <td>2024-01-15</td>
              <td>
                <button>View</button>
                <button>Resolve</button>
                <button>Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsList;
