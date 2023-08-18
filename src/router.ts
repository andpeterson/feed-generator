import express from 'express'
import path from 'path'
import { AppContext } from './config'

const makeRouter = (ctx: AppContext) => {
  const router = express.Router()

  router.get('/', (req, res) => {
    res.redirect('https://bsky.app/profile/zenthia.bsky.social')
  })
  
  router.get('/feed', (req, res) => {
    res.redirect('https://bsky.app/profile/did:plc:7j42jgeg2ur7mn64llu5pm4q/feed/pv-posts')
  })

  router.get('/addMember', (req, res) => {
    if (!ctx.cfg.serviceDid.endsWith(ctx.cfg.hostname)) {
      return res.sendStatus(404)
    }
    res.sendFile(path.join(__dirname, '/addMember.html'));

  })

  router.get('/addMemberData', (req, res) => {
    if (!ctx.cfg.serviceDid.endsWith(ctx.cfg.hostname)) {
      return res.sendStatus(404)
    }

    //insert into pv_members values('did:plc:4ndyufcdqvuihxwsicuaboru', '@progressivevictory.win');
    // TODO: I need to cleanup data being passed in
    const dbRes = ctx.db
      .insertInto('pv_members')
      .values({
        did: ''+ req.query.userDID,
        handle: '@' + req.query.userHandle
      })
      .onConflict((oc) => oc.doNothing())
      .execute()
    //TODO: proper responses based on dbRes
    console.log("Added " + req.query.userHandle + " to pv_members")
    res.sendStatus(200);
  })

  router.get('/.well-known/did.json', (_req, res) => {
    if (!ctx.cfg.serviceDid.endsWith(ctx.cfg.hostname)) {
      return res.sendStatus(404)
    }
    res.json({
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: ctx.cfg.serviceDid,
      service: [
        {
          id: '#bsky_fg',
          type: 'BskyFeedGenerator',
          serviceEndpoint: `https://${ctx.cfg.hostname}`,
        },
      ],
    })
  })

  return router
}
export default makeRouter


