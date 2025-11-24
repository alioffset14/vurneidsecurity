import React from 'react';
import TestDetailsTable from './TestDetailsTable';
import { sampleTest } from './sampleTest';
import './TestDetailsTable.css';

function TestPage() {
  return (
    <div style={{ padding: 20 }}>
      <TestDetailsTable test={sampleTest} />
    </div>
  );
}

export default TestPage;
