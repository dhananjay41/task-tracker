import { TaskService } from '../services/taskService';
import { Status } from '@prisma/client';

describe('Task Status Transitions', () => {
  it('should allow valid transition from TODO to IN_PROGRESS', () => {
    expect(() => (TaskService as any).validateStatusTransition(Status.TODO, Status.IN_PROGRESS))
      .not.toThrow();
  });

  it('should allow transition to BLOCKED from any state', () => {
    expect(() => (TaskService as any).validateStatusTransition(Status.DONE, Status.BLOCKED))
      .not.toThrow();
  });

  it('should throw error for invalid transition from TODO to DONE', () => {
    expect(() => (TaskService as any).validateStatusTransition(Status.TODO, Status.DONE))
      .toThrow('Cannot transition from TODO to DONE');
  });

  it('should allow unblocking back to any major state', () => {
    expect(() => (TaskService as any).validateStatusTransition(Status.BLOCKED, Status.IN_PROGRESS))
      .not.toThrow();
  });
});
