import { Router } from 'express';
import { getAllPagesInSpace, getPageById } from '../services/confluenceClient';
import { ensureAuthenticated } from '../middleware/ensureAuthenticated';


const router = Router();

// Set the authentication middleware to all /pages routes.
router.use(ensureAuthenticated);

router.get('/space/:spaceKey', async (req, res) => {
  const spaceKey = req.params.spaceKey;
  const authToken = req.cookies?.["confluenceToken"];
  const cloudId = req.cookies?.["confluenceCloudId"];
  try {
    const pages = await getAllPagesInSpace(spaceKey, cloudId, authToken);
    res.json(pages.results);
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error("Unauthorized access: ", error.response.status);
      // Clear the token cookies, as the request didn't succeed - next time user will have to re-authinticate 
      res.clearCookie("confluenceToken");
      res.clearCookie("confluenceCloudId");
      res.status(401).send("Authentication error. Refresh and re-authenticate");
    }
    else if (error.response?.status === 404 || error.response?.status === 400) {
      res.status(404).send("Requested space doesn't exist");
    }
    else {
      console.error("Error fetching pages:", error);
      res.status(500).send("Error fetching from Confluence");
    }  
  }
});

router.get('/:pageId', async (req, res) => {
  const pageId = req.params.pageId;
  const authToken = req.cookies?.["confluenceToken"];
  const cloudId = req.cookies?.["confluenceCloudId"];
  try {
    const content = await getPageById(pageId, cloudId, authToken);
    res.json(content);
  } catch (error: any) {
      if (error.response?.status === 401) {
        console.error("Unauthorized access: ", error.response.status);
        // Clear the token cookies, as the request didn't succeed - next time user will have to re-authinticate 
        res.clearCookie("confluenceToken");
        res.clearCookie("confluenceCloudId");
        res.status(401).send("Authentication error. Refresh and re-authenticate");
      }
      else if (error.response?.status === 404) {
        res.status(404).send("Requested id doesn't exist");
      }
      else {
        console.error("Error fetching pages:", error);
        res.status(500).send("Error fetching from Confluence");
      }  
    }
});


export default router;
