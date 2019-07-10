// third-party library
import bcrypt from 'bcryptjs';

// project files
import models from '../models';
import ProfileRepository from './ProfileRepository';

/**
 * @description user repository class
 * 
 * @method isRegistered
 * @method registerUser
 * @method loginUser
 * 
 */
export default class UserRepository {
  /**
   * @description method to check if user already exists
   * 
   * @param email
   * 
   * @returns { boolean } true | false
   */
  static isRegistered = async (email) => {
    const user = await models.User.findOne({ email });

    if (user) {
      return true;
    }

    return false;
  }
  
  /**
   * @description method to handle user registration
   * 
   * @param req.body
   * 
   * @return user object
   */
  static registerUser = async (requestObject) => {
    const { email, phone, password } = requestObject;
    const lastName = requestObject.lastName.toString().toLowerCase();
    const firstName = requestObject.firstName.toString().toLowerCase();

    // insert profile initial details
    const profile = await ProfileRepository.insertInitialDetails({ firstName, lastName, email });
    const profileId = profile.id;

    if (profileId) {
      const userModel = new models.User({
        firstName,
        lastName,
        email,
        phone,
        password,
        profileId
      });

      const user = await userModel.save();
      if (user) {
        return user;
      }
      
      // remove created profile if user creation fails
      const profile = await ProfileRepository.deleteUserProfile(profileId);
      if (typeof profile === 'string') {
        throw new Error(profile);
      }
      throw new Error('there was error registering user');
    }

    throw new Error('there was error registering user profile');
  }

  /**
   * @description method to handle user login
   * 
   * @parameter req.body
   * 
   * @return user details { res.body }
   */
  static loginUser = async ({ email, password }) => {
    const isUser = await this.isRegistered(email);

    if (!isUser) {
      throw new Error('user with specified email is not found');
    }

    const userObject = models.User;
    const user = await userObject.findOne({ email });
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (isValidPassword) {
      return user;
    }

    return null;
  }
}
