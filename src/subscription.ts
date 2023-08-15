import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

// # https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${YOUR_HANDLE}
let PVmembers = {
  '@progressivevictory.win': 'did:plc:4ndyufcdqvuihxwsicuaboru',
  '@zenthia.bsky.social': 'did:plc:7j42jgeg2ur7mn64llu5pm4q',
  '@rotful.bsky.social': 'did:plc:jt3dj4hrestgd45vaqoihjtc',
  '@emmadearest.bsky.social': 'did:plc:puadw3m3eeifb4ueo6ny5633',
  '@astroria.bsky.social': 'did:plc:6fkhq4aeky6mf63calhk5l57',
  '@maydae.bsky.social': 'did:plc:syk2r5kmjimipsgqnl6s24wq',
  '@mben92.bsky.social': 'did:plc:sxv3pfhdvo7gbdfo3y6zonov',
  '@atkatandrea.bsky.social': 'did:plc:ed5n2hrrgqnbfx7wfpgzyqre',
  '@kindredspirit.bsky.social': 'did:plc:vh4bc4ryrt6a6hmnltwmbjpx',
  '@okami.codes': 'did:plc:ihjhydotnviqfmkk5jnd33er',
  '@fanaticalwarlock.bsky.social': 'did:plc:argbyx5durj5ccioje2iobsh',
  '@ctrl-f-u.bsky.social': 'did:plc:zugoqedwkioidgtq4cxoqnfc',
  '@shiniblackrose.bsky.social': 'did:plc:g33c2efrnpzt4uxya3ewbfif',
  '@jokeroker.bsky.social': 'did:plc:er6mk5wf4thwici722mfcynw',
  '@majority.blue': 'did:plc:cvr4febfw7fz2kla7caslrtm',
  '@caaaadnen.bsky.social': 'did:plc:caeknvgqtpzol6vdafrzl7tw',
  '@left4reach44.bsky.social': 'did:plc:74szgvuj5u3cmu5aryuopvy7',
  '@helenasden.bsky.social': 'did:plc:sqt2di6xgmqjybutobtnx76d',
  '@samhandle.bsky.social': 'did:plc:fytavbss55b2ssbmpzdppmon',
  '@meronoir.bsky.social': 'did:plc:wfckyjtg2v7ddgralirwvraf',
  '@coolmn16.bsky.social': 'did:plc:im5hblti5dxwwytsw65zyndk',
  '@silvertrianon.bsky.social': 'did:plc:olrtaqtwcmfta5dqkkzrpuxr',
  '@yunoalexia2001.bsky.social': 'did:plc:b5saccoikwn3kzdjpgzp4k4q',
  '@indatrocities.bsky.social': 'did:plc:zqqpgg645ux2b2uxrg5gqqxi',
  '@stazhavoc.bsky.social': 'did:plc:7hmtk3hw6ss6xdnvmb6uq33y'
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    // for (const post of ops.posts.creates) {
    //   console.log(post.record.text + '\n-------------------------')
    // }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // only PV posts
        //return create.record.text.toLowerCase().includes('is')
        //create.record.text.toLocaleUpperCase()
        //console.log(create.author.toLowerCase())
        const authorIsPVmember = Object.values(PVmembers).includes(create.author.toLowerCase())
        if(authorIsPVmember){
          console.log(create.record.text)
        }
        return authorIsPVmember
      })
      .map((create) => {
        // map PV posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: create.record?.reply?.parent.uri ?? null,
          replyRoot: create.record?.reply?.root.uri ?? null,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      const res = await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
