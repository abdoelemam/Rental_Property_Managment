import { UserRole } from '../DB/models/user.model';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: UserRole;
                name: string;
            };
        }
    }
}

export { };
