import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

import { User } from '../../models';
import { UserDb } from '../../database';

/**
 * Interface for user details passed in JWT
 */
export interface IUser {
    username: string;
    email: string;
}

export class Auth {
    // Encryption keys shared across microservices
    private public: string;
    private secret: string;
    private userDb: UserDb;

    constructor(userDb: UserDb) {
        this.userDb = userDb;

        const keys = path.join(__dirname, '..', '..', '..', 'config');
        this.public = fs.readFileSync(`${keys}/public.key`, 'utf8').toString();
        this.secret = fs.readFileSync(`${keys}/private.key`, 'utf8').toString();
    }

    /**
     * Authenticate a user by generating a token associated to it with an experiation time
     *
     * @param {User} user - user to authenticate
     * @returns {string} - returns a jwt for that specific user to use for authentication
     * @memberof JWTAuth
     */
    public authenticate(user: User): string {
        return jwt.sign(
            {
                email: user.email,
                username: user.username
            },
            this.secret,
            {
                algorithm: 'RS256',
                expiresIn: '2 days'
            }
        );
    }

    /**
     * Validate a given user with a user defined token.
     * Will throw an exception if there is no match.
     * User object from db is returned if there is no discrepency
     *
     * @param {string} token - token passed in by the client
     * @returns {Promise<IUser>} - promise containing the IUser that can be used to retrieve other data
     * @memberof JWTAuth
     */
    public async validate(token: string): Promise<IUser> {
        try {
            const decode: any = jwt.verify(token, this.public, {
                algorithms: ['RS256']
            }); // Verify that the given token is a valid token
            // TODO: Get user from repository
            const user = await this.userDb.findByUsername(decode.username);

            return {
                username: user.username,
                email: user.email
            };
        } catch (err) {
            console.log(err.message);
            throw new Error(
                'Given token could not be verified for authorization.'
            );
        }
    }
}