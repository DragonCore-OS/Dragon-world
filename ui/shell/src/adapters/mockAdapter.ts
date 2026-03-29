export interface MockProposal {
  id: string;
  statusLabel: string;
  title: string;
  description: string;
  prId: string;
}

export function getMockProposals(): MockProposal[] {
  return [
    {
      id: 'mock-001',
      statusLabel: 'Bridge Pending',
      title: 'Add room to the south (Mock)',
      description: 'AI proposes: suggest expanding a new room to the south of core_room.',
      prId: 'PR-882',
    },
  ];
}

export function getMockAnnotationLabels(): Record<string, string> {
  return {
    kernel: 'KERNEL-BACKED',
    bridge: 'BRIDGE-BACKED',
    mock: 'MOCK-ONLY',
  };
}
