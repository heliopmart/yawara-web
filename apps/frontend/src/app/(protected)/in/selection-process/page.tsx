'use client'
import React, { useState, useEffect } from 'react';
import CardFlow from '@/components/selectionProcess/CardFlow';
import {ProcessTimeline} from '@/components/selectionProcess/ProcessTimeline';


const ProcessSelectionPage: React.FC = () => {
  return (
    <ProcessTimeline />
  );
};

export default ProcessSelectionPage;