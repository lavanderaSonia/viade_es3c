import data from "@solid/query-ldflex";
import { AccessControlList } from "@inrupt/solid-react-components";
import { resourceExists, createDoc, createDocument } from "./ldflex-helper";
import {
  storageHelper,
  errorToaster,
  permissionHelper,
  ldflexHelper
} from "@utils";
import { Route } from "../domain";
import routeShape from "@contexts/route-shape.json";

const appPath = process.env.REACT_APP_VIADE_ES3C_PATH;

const N3 = require("n3");
const store = new N3.Store();
const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;

export const create = (ruta, rutaShape) => {
  const writer = new N3.Writer();
  const quads =  new Array();
  quads.push(quad(
    namedNode(ruta.webId),
    namedNode(getPredicate(rutaShape.shape[0], rutaShape)),
    literal(ruta.name)
  ));
  quads.push(quad(
    namedNode(ruta.webId),
    namedNode(getPredicate(rutaShape.shape[1], rutaShape)),
    literal(ruta.longitude)
  ));
  return writer.quadsToString(quads);
};


export const getPredicate = (field, routeShape) => {
  const prefix = routeShape['@context'][field.prefix];
  return `${prefix}${field.predicate}`;
}
/**
 * Creates a valid string that represents the application path. This is the
 * default value if no storage predicate is discovered
 * @param webId
 * @param path
 * @returns {*}
 */
export const buildPathFromWebId = (webId, path) => {
  if (!webId) return false;
  const domain = new URL(typeof webId === "object" ? webId.webId : webId)
    .origin;
  return `${domain}/${path}`;
};

function randomStr(len) {
  return Math.floor(Math.random() * len);
}
export const createRoute = async webId => {
  try {
    // First, check if we have WRITE permission for the app
    const hasWritePermission = await permissionHelper.checkSpecificAppPermission(
      webId,
      AccessControlList.MODES.WRITE
    );

    // If we do not have Write permission, there's nothing we can do here
    if (!hasWritePermission) return;

    // Get the default app storage location from the user's pod and append our path to it
    const viadeUrl = await getAppStorage(webId);

    // Set up various paths relative to the viade URL

    const rutaPruebaFilePath = `${viadeUrl}porfavorquefuncione5.ttl`;
    const ruta = new Route("gema", "5.4");
    ruta.webId = webId;

    const body = create(ruta, routeShape);

    const pruebaFileExists = await resourceExists(rutaPruebaFilePath);
    if (!pruebaFileExists) {
      const newDocument = await ldflexHelper.createDocumentWithTurtle(
        rutaPruebaFilePath,
        body
      );
      if (!newDocument) {
        return {
          added: false
        };
      }
    }
    return true;
  } catch (error) {
    errorToaster(error.message, "Error");
    return false;
  }
};

/**
 * Helper function to check for the user's pod storage value. If it doesn't exist, we assume root of the pod
 * @returns {Promise<string>}
 */
export const getAppStorage = async webId => {
  const podStoragePath = await data[webId].storage;
  let podStoragePathValue =
    podStoragePath && podStoragePath.value.trim().length > 0
      ? podStoragePath.value
      : "";

  // Make sure that the path ends in a / so it is recognized as a folder path
  if (podStoragePathValue && !podStoragePathValue.endsWith("/")) {
    podStoragePathValue = `${podStoragePathValue}/`;
  }

  // If there is no storage value from the pod, use webId as the backup, and append the application path from env
  if (!podStoragePathValue || podStoragePathValue.trim().length === 0) {
    return buildPathFromWebId(webId, appPath);
  }

  return `${podStoragePathValue}${appPath}`;
};

/**
 *  Check and create the initial app files and folders
 * @param folderPath
 * @returns {Promise<boolean>} Returns whether or not there were any errors during the creation process
 */
export const createInitialFiles = async webId => {
  try {
    // First, check if we have WRITE permission for the app
    const hasWritePermission = await permissionHelper.checkSpecificAppPermission(
      webId,
      AccessControlList.MODES.WRITE
    );

    // If we do not have Write permission, there's nothing we can do here
    if (!hasWritePermission) return;

    // Get the default app storage location from the user's pod and append our path to it
    const viadeUrl = await getAppStorage(webId);
    // Set up various paths relative to the game URL
    const dataFilePath = `${viadeUrl}data.ttl`;
    const settingsFilePath = `${viadeUrl}settings.ttl`;

    // Check if the tictactoe folder exists, if not then create it. This is where game files, the game inbox, and settings files are created by default
    const gameFolderExists = await resourceExists(viadeUrl);
    if (!gameFolderExists) {
      await createDoc(data, {
        method: "PUT",
        headers: {
          "Content-Type": "text/turtle"
        }
      });
    }

    // Check if data file exists, if not then create it. This file holds links to other people's games
    const dataFileExists = await resourceExists(dataFilePath);
    if (!dataFileExists) {
      await createDocument(dataFilePath);
    }

    // Check if the settings file exists, if not then create it. This file is for general settings including the link to the game-specific inbox
    const settingsFileExists = await resourceExists(settingsFilePath);
    if (!settingsFileExists) {
      await createDocument(settingsFilePath);
    }
    createRoute(webId);
    return true;
  } catch (error) {
    errorToaster(error.message, "Error");
    return false;
  }
};

export const checkAndInitializeInbox = async () => "";
