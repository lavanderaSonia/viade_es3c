import {
  AccessControlList,
  AppPermission
} from "@inrupt/solid-react-components";
import { errorToaster } from "@utils";

// Check that all permissions we need are set. If any are missing, this returns false
import auth from "solid-auth-client";
import FC from "solid-file-client"

const checkAppPermissions = (userAppPermissions, appPermissions) =>
  appPermissions.every(permission => userAppPermissions.includes(permission));

// Function to check for a specific permission included in the app
export const checkSpecificAppPermission = async (webId, permission) => {
  try {
    const userAppPermissions = await AppPermission.checkPermissions(webId);
    return userAppPermissions.permissions.includes(permission);
  } catch (e) {}
};
/**
 * SDK app will need all the permissions by the user pod so we check these permissions to work without any issues.
 * Error Message object is to hold the title, message, etc strings, as we can't use i18n libraries in this non-React file
 */
export const checkPermissions = async (webId, errorMessage) => {
  /**
   * Get permissions from trustedApp.
   */
  const userApp = await AppPermission.checkPermissions(webId);

  /**
   * Get modes permissions from solid-react-components
   */
  const permissions = AccessControlList.MODES;
  const { APPEND, READ, WRITE, CONTROL } = permissions;

  // If we are missing permissions that the app requires, display an error message with a Learn More link
  if (
    userApp === null ||
    userApp.permissions === null ||
    !checkAppPermissions(userApp.permissions, [APPEND, READ, WRITE, CONTROL])
  ) {
    errorToaster(errorMessage.message, errorMessage.title, {
      label: errorMessage.label,
      href: errorMessage.href
    });
  }
};

/**
 * Helper function to fetch permissions for the viade inbox, and if permissions are not set
 * correctly, then add them. This repairs a broken inbox.
 * @param inboxPath
 * @returns {Promise<void>}
 */
export const checkOrSetInboxAppendPermissions = async (inboxPath, webId) => {
  // Fetch app permissions for the inbox and see if Append is there
  const inboxAcls = new AccessControlList(webId, inboxPath);
  const permissions = await inboxAcls.getPermissions();
  const inboxPublicPermissions = permissions.filter(
    perm => perm.agents === null
  );

  const appendPermission = inboxPublicPermissions.filter(perm =>
    perm.modes.includes(AccessControlList.MODES.APPEND)
  );

  if (appendPermission.length <= 0) {
    // What do we do when the permission is missing? Add it!
    try {
      // Permission object to add. A null agent means Everyone
      const permissions = [
        {
          agents: null,
          modes: [AccessControlList.MODES.APPEND]
        }
      ];
      const ACLFile = new AccessControlList(webId, inboxPath);
      await ACLFile.createACL(permissions);
    } catch (error) {
      // TODO: Better error handling here
      throw error;
    }
  }

  return true;
};

export const sharing = async (webId, friendId, shareUrl) => {
  const fc   = new FC( auth )
  let ruta = shareUrl;
  let webID = webId;
  let id = friendId;
  let baseAcl = `@prefix : <#>.
  @prefix n0: <http://www.w3.org/ns/auth/acl#>.
  @prefix c: </profile/card#>.
  @prefix c0: <{$id}>.
  @prefix n1: <http://xmlns.com/foaf/0.1/>.
  
  :ControlReadWrite
      a n0:Authorization;
      n0:accessTo <{$ruta}>;
      n0:agent c:me;
      n0:mode n0:Control, n0:Read, n0:Write.
  :Read
      a n0:Authorization;
      n0:accessTo <{$ruta}>;
      n0:agent c0:me;
      n0:agentClass n1:Agent;
      n0:mode n0:Read.`;
  fc.updateFile(shareUrl+".acl", baseAcl, "text/turtle").then(success =>{
    console.log(shareUrl+".acl");
    console.log('permissions given');
  }, (err: any) => console.log(err));

}
