/** Frontend data service: no application backend, database, or credentials. */
export {getTracks,getTrack} from './catalogue.js';
export {getProfile,saveProfile,getFeedback,setFeedback,getPlaylist,savePlaylist,deletePlaylist,getLibrary} from '../playlists/manager.js';
export const getHealth=async()=>({status:'static',phase:'2.5'});
