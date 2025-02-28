This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Sports Team Management System

A comprehensive platform for managing sports teams, players, and games with role-based access control.

## Authentication System

This application implements a flexible authentication system with role-based access control:

### Key Features

- **Role-Based Access Control**: Three primary roles (Player, Manager, Admin) with different permissions
- **Development Mode Authentication**: Simplified authentication for testing and development
- **Token-Based Authentication**: Secure cookie-based token authentication
- **Middleware Protection**: API routes protected with authentication middleware
- **Permission Checks**: Fine-grained access control based on user roles and relationships

### Roles and Permissions

| Role | Permissions |
|------|-------------|
| **Player** | - View own profile<br>- View own team<br>- View own player stats<br>- View public game information |
| **Manager** | - All Player permissions<br>- Create/edit/delete teams<br>- Add/remove/update players<br>- Schedule games<br>- View all teams and players |
| **Admin** | - All Manager permissions<br>- System-wide administration<br>- User management |

### Authentication Implementation

The authentication system is implemented in `/src/utils/auth-utils.ts` with the `withAuth` middleware function that:

1. Extracts and validates authentication tokens
2. Creates user sessions with role information
3. Provides role-based access control
4. Handles authentication errors

### API Security

All API endpoints implement role-based access control to ensure users can only access and modify data according to their permissions.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

Two test scripts are provided to verify the authentication and role-based access control:

- `team-testing.sh`: Tests all team-related endpoints with different user roles
- `player-testing.sh`: Tests all player-related endpoints with different user roles

To run the tests:

```bash
# Make sure the development server is running
./team-testing.sh
./player-testing.sh
```

## Environment Variables

The following environment variables are required:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
NEXT_PUBLIC_SITE_URL=your_site_url
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
