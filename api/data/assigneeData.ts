import { Assignee, CITIES, ASSIGNEE_HQ_TAKEOVER } from '../types/order';

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ASSIGNEE_NAMES = [
  '张三', '李四', '王五', '赵六', '钱七',
  '孙八', '周九', '吴十', '郑十一', '王十二'
];

const LEVELS: Array<'primary' | 'secondary' | 'normal'> = ['primary', 'secondary', 'normal'];

export function generateAssignees(): Assignee[] {
  const assignees: Assignee[] = ASSIGNEE_NAMES.map((name, index) => ({
    id: `ASSIGNEE${String(index + 1).padStart(4, '0')}`,
    name,
    city: random(CITIES),
    level: random(LEVELS)
  }));

  assignees.push({
    id: 'ASSIGNEE_HQ',
    name: ASSIGNEE_HQ_TAKEOVER,
    city: '总部',
    level: 'primary'
  });

  return assignees;
}

export const assignees: Assignee[] = generateAssignees();

export function getAssigneeByName(name: string): Assignee | undefined {
  return assignees.find(a => a.name === name);
}

export function getAssigneesByCity(city: string): Assignee[] {
  return assignees.filter(a => a.city === city);
}

export function getAssigneeCity(name: string): string | undefined {
  const assignee = getAssigneeByName(name);
  return assignee?.city;
}
