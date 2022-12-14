import serveStatic from 'serve-static-bun'
import PrettyError from 'pretty-error'

import {outputPath as assetsOutputPath} from '#compiler'
// import {outputPath as assetsOutputPath} from '#asset-compiler'
// import render, {startWatching} from '#render-function'
import console from '../utils/console'

const pe = new PrettyError()

/**
 * @param entry Absolute path to entry file
 * */
export default function cherryCola(entry): (req: Request) => Promise<Response> {
    process.env.CHERRY_COLA_ENTRY = entry
    const serveStaticListener: (req: Request) => Promise<Response> = serveStatic(assetsOutputPath)

    return async (req) => {
        // todo: routing; next if request should not be handled
        const res: Response = await serveStaticListener(req)
        if (res.status < 400) return res
        try {
            return new Response('render(App())', {
                headers: {
                    "Content-Type": "text/html; charset=utf-8"
                }
            })
        } catch (err) {
            console.error('Error during rendering:')
            console.log(pe.render(err))
            return new Response('Internal Error', {
                status: 500
            })
        }
    }
}
