// Shared configuration for active job roles
export interface JobRole {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string[];
    salary: string;
    status: 'active' | 'paused' | 'closed';
}

export const DEFAULT_ACTIVE_ROLES: JobRole[] = [
    {
        id: '1',
        title: 'Senior Frontend Engineer',
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
        description: 'We are looking for an experienced frontend engineer to lead our web development initiatives.',
        requirements: ['5+ years React experience', 'TypeScript expertise', 'Design system experience', 'Team leadership'],
        salary: '$150k - $200k',
        status: 'active',
    },
    {
        id: '2',
        title: 'ML Engineer',
        department: 'AI/ML',
        location: 'San Francisco, CA',
        type: 'Full-time',
        description: 'Join our AI team to build cutting-edge machine learning models and infrastructure.',
        requirements: ['Python/TensorFlow', 'MLOps experience', 'PhD or 3+ years experience', 'Research background'],
        salary: '$180k - $250k',
        status: 'active',
    },
    {
        id: '3',
        title: 'Backend Engineer',
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
        description: 'Build scalable backend systems that power our platform.',
        requirements: ['Node.js or Python', 'Database design', 'API development', 'Cloud infrastructure'],
        salary: '$140k - $190k',
        status: 'active',
    },
];

// Get only active role titles for pipeline filtering
export const getActiveRoleTitles = (roles: JobRole[] = DEFAULT_ACTIVE_ROLES): string[] => {
    return roles.filter(role => role.status === 'active').map(role => role.title);
};
