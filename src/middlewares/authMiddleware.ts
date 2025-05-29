import {NextRequest, NextResponse} from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";
import {ACCESS_TOKEN_EXP, PUBLIC_BACKEND_URL, REFRESH_TOKEN_EXP} from "@/constants";

const refreshTokenPromises = new Map<string, any>()

export default async function authMiddleware(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;
  const refreshToken = req.cookies.get('refresh_token')?.value;
  let newRefreshToken, newAccessToken;
  if (refreshToken) {
    const decodedToken: any = jwt.decode(accessToken || '');
    const expiresAt = !decodedToken?.exp ? 0 : decodedToken.exp * 1000;
    // if less than 1 minute is left, refresh
    if (new Date(expiresAt).getTime() - Date.now() < 60000) {
      const data = await doRefreshToken({refreshToken});
      if (data) {
        newAccessToken = data.accessToken;
        newRefreshToken = data.refreshToken;
        req.cookies.set('access_token', newRefreshToken);
        req.cookies.set('refresh_token', newRefreshToken,);
      }
    }
  }
  const res = NextResponse.next()
  if (newAccessToken && newRefreshToken) {
    res.cookies.set('access_token', newAccessToken, {maxAge: ACCESS_TOKEN_EXP, path: '/'});
    res.cookies.set('refresh_token', newRefreshToken, {maxAge: REFRESH_TOKEN_EXP, path: '/'});

    // clear map
    refreshTokenPromises.delete(refreshToken!);
  }
  return res;
}

// store the promises based on the refreshToken (store in a map)
const doRefreshToken = ({refreshToken}) => {
  if (refreshTokenPromises.has(refreshToken)) {
    return refreshTokenPromises.get(refreshToken);
  }
  const promise = refreshTokenRequest({refreshToken});
  refreshTokenPromises.set(refreshToken, promise);

  return promise;
}

const refreshTokenRequest = async ({refreshToken: prevRefreshToken}) => {
  try {
    const {data} = await axios.post(`${PUBLIC_BACKEND_URL}/api/auth/token/refresh`, {
      token: prevRefreshToken,
    })
    const accessToken = data.access_token  as string;
    const refreshToken  = data.refresh_token as string;

    return {accessToken, refreshToken};
  } catch (e) {
    console.error(e, 'failed refreshing in middleware');
    return null;
  }
}
