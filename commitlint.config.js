export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'ticket-required': (parsed) => {
          const { subject } = parsed;
          if (!subject) {
            return [false, 'Subject cannot be empty'];
          }

          if (!/^PAT-[1-9]\d*\s+/.test(subject)) {
            return [
              false,
              'Subject must start with a current issue reference. Use `type: PAT-123 description`.',
            ];
          }

          return [true, ''];
        },
      },
    },
  ],
  rules: {
    'scope-empty': [2, 'always'],
    'subject-case': [0],
    'subject-max-length': [2, 'always', 72],
    'ticket-required': [2, 'always'],
  },
};
