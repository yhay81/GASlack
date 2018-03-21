import { extend, queryEncode } from './util';

const DEFAULT_RETRIES = 3;

class BaseAPI {
  protected token_;
  private retries_limit_;
  static API_ENDPOINT = 'https://slack.com/api/';
  constructor(token = null, retries_limit = DEFAULT_RETRIES) {
    this.token_ = token;
    this.retries_limit_ = retries_limit;
  }

  get_(api, params = {}) {
    // https://github.com/requests/requests/blob/master/requests/models.py
    params = extend({ token: this.token_ }, params);
    const encodedParams = queryEncode(params);
    const url = `${BaseAPI.API_ENDPOINT}${api}?${encodedParams}`;
    return this.fetch_(url);
  }

  post_(api, data = {}) {
    const url = `${BaseAPI.API_ENDPOINT}${api}`;
    const payload = extend({ token: this.token_ }, data);
    for (let key in payload) {
      if (payload[key] == null) delete payload[key];
    }
    return this.fetch_(url, { method: 'post', payload });
  }

  fetch_(url, options = null) {
    let response = null;
    for (let retry = 0; retry < this.retries_limit_; retry++) {
      try {
        if (options === null) {
          response = UrlFetchApp.fetch(url);
        } else {
          response = UrlFetchApp.fetch(url, options);
        }
      } catch (e) {
        throw e;
      }
      // handle HTTP 429 as documented at
      // https://api.slack.com/docs/rate-limits
      if (response.getResponseCode() === 429) {
        Utilities.sleep(parseInt(response.getHeaders()['retry-after']));
        continue;
      }
      return response;
    }
    throw Error('Try limit over');
  }
}

class API extends BaseAPI {
  test(error = null, data = {}) {
    data = extend({ error }, data);
    return this.post_('api.test', data);
  }
}

class AppsPermissions extends BaseAPI {
  info() {
    return this.get_('apps.permissions.info');
  }

  request(scopes: Array<string>, trigger_id) {
    const params = { scopes: scopes.join(','), trigger_id };
    return this.get_('apps.permissions.request', params);
  }
}

class Apps extends BaseAPI {
  public permissions;
  constructor(token, retries_limit) {
    super(token, retries_limit);
    this.permissions = new AppsPermissions(token, retries_limit);
  }
}

class Auth extends BaseAPI {
  revoke(test = null) {
    const params = { test };
    return this.get_('auth.revoke', params);
  }

  test() {
    return this.post_('auth.test');
  }
}

class Bots extends BaseAPI {
  info(bot = null) {
    const params = { bot };
    return this.get_('bots.info', params);
  }
}

class Channels extends BaseAPI {
  archive(channel: string) {
    const data = { channel };
    return this.post_('channels.archive', data);
  }

  create(name: string, validate: boolean) {
    const params = { name, validate };
    return this.get_('channels.create', params);
  }

  history(
    channel: string,
    count: number = 100,
    inclusive = false,
    latest = 'now',
    oldest = 0,
    unreads = false
  ) {
    const params = { channel, count, inclusive, latest, oldest, unreads };
    return this.get_('channels.history', params);
  }

  info(channel, include_locale = false) {
    const params = { channel, include_locale };
    return this.get_('channels.info', params);
  }

  invite(channel, user) {
    const data = { channel, user };
    return this.post_('channels.invite', data);
  }

  join(name, validate = false) {
    const data = { name, validate };
    return this.post_('channels.join', data);
  }

  kick(channel, user) {
    const data = { channel, user };
    return this.post_('channels.kick', data);
  }

  leave(channel) {
    const data = { channel };
    return this.post_('channels.leave', data);
  }

  list(cursor = null, exclude_archived = false, exclude_members = false, limit = 0) {
    const params = { cursor, exclude_archived, exclude_members, limit };
    return this.get_('channels.list', params);
  }

  mark(channel, ts) {
    const data = { channel, ts };
    return this.post_('channels.mark', data);
  }

  rename(channel, name, validate = null) {
    const params = { validate, channel, name };
    return this.get_('channels.rename');
  }

  replies(channel, thread_ts) {
    const params = { channel, thread_ts };
    return this.get_('channels.replies', params);
  }

  setPurpose(channel, purpose) {
    const data = { channel, purpose };
    return this.post_('channels.setPurpose', data);
  }

  setTopic(channel, topic) {
    const data = { channel, topic };
    return this.post_('channels.setTopic', data);
  }

  unarchive(channel) {
    const data = { channel };
    return this.post_('channels.unarchive', data);
  }
}

class Chat extends BaseAPI {
  delete_(channel, ts, as_user = false) {
    const data = { channel, ts, as_user };
    return this.post_('chat.delete', data);
  }

  getPermalink(channel, massage_ts) {
    const params = { name, massage_ts };
    return this.get_('chat.getPermalink', params);
  }

  meMessage(channel, text) {
    const data = { channel, text };
    return this.post_('chat.meMessage', data);
  }

  postEphemeral(
    channel,
    text,
    user,
    as_user = false,
    attachments = null,
    link_names = false,
    parse = 'none'
  ) {
    const data = { channel, text, user, as_user, attachments, link_names, parse };
    return this.post_('chat.postEphemeral', data);
  }

  postMessage(
    channel,
    text,
    as_user = false,
    attachments = null,
    icon_emoji = null,
    icon_url = null,
    link_names = false,
    mrkdwn = true,
    parse = 'none',
    reply_broadcast = false,
    thread_ts = null,
    unfurl_links = false,
    unfurl_media = true,
    username = null
  ) {
    const data = {
      channel,
      text,
      as_user,
      attachments,
      icon_emoji,
      icon_url,
      link_names,
      mrkdwn,
      parse,
      reply_broadcast,
      thread_ts,
      unfurl_links,
      unfurl_media,
      username
    };
    return this.post_('chat.postMessage', data);
  }

  unfurl(
    channel,
    ts,
    unfurls,
    user_auth_message = null,
    user_auth_required = false,
    user_auth_url = null
  ) {
    const data = { channel, ts, unfurls, user_auth_message, user_auth_required, user_auth_url };
    return this.post_('chat.unfurl', data);
  }

  update(
    channel,
    text,
    ts,
    as_user = false,
    attachments = null,
    link_names = 'none',
    parse = 'client'
  ) {
    const data = { channel, text, ts, as_user, attachments, link_names, parse };
    return this.post_('chat.update', data);
  }
}

class Conversations extends BaseAPI {
  archive(channel: string) {
    const data = { channel };
    return this.post_('conversations.archive', data);
  }

  close(channel) {
    const params = { channel };
    return this.get_('conversations.close', params);
  }

  create(name, is_private = false) {
    const params = { name, is_private };
    return this.get_('conversations.create', params);
  }

  history(
    channel: string,
    count: number = 100,
    inclusive = false,
    latest = 'now',
    oldest = 0,
    unreads = false
  ) {
    const params = { channel, count, inclusive, latest, oldest, unreads };
    return this.get_('conversations.history', params);
  }

  info(channel, include_locale = false) {
    const params = { channel, include_locale };
    return this.get_('conversations.info', params);
  }

  invite(channel, user) {
    const data = { channel, user };
    return this.post_('conversations.invite', data);
  }

  join(name, validate = false) {
    const data = { name, validate };
    return this.post_('conversations.join', data);
  }

  kick(channel, user) {
    const data = { channel, user };
    return this.post_('conversations.kick', data);
  }

  leave(channel) {
    const data = { channel };
    return this.post_('conversations.leave', data);
  }

  list(
    cursor = null,
    exclude_archived = false,
    exclude_members = false,
    limit = 100,
    types = 'public_channel'
  ) {
    const params = { cursor, exclude_archived, exclude_members, limit, types };
    return this.get_('conversations.list', params);
  }

  member(channel, cursor = null, limit = 100) {
    const data = { channel, cursor, limit };
    return this.post_('conversations.member', data);
  }

  open(channel = null, return_im = false, users = null) {
    const data = { channel, return_im, users };
    if (Array.isArray(users)) data['users'] = users.join(',');
    return this.post_('conversations.open', data);
  }

  rename(channel, name, validate = null) {
    const data = { validate, channel, name };
    return this.post_('conversations.rename', data);
  }

  replies(
    channel,
    thread_ts,
    cursor = null,
    inclusive = false,
    latest = 'now',
    limit = 10,
    oldest = 0
  ) {
    const params = { thread_ts, cursor, inclusive, latest, limit, oldest };
    return this.get_('conversations.replies', params);
  }

  setPurpose(channel, purpose) {
    const data = { channel, purpose };
    return this.post_('conversations.setPurpose', data);
  }

  setTopic(channel, topic) {
    const data = { channel, topic };
    return this.post_('conversations.setTopic', data);
  }

  unarchive(channel) {
    const data = { channel };
    return this.post_('conversations.unarchive', data);
  }
}

class Dialog extends BaseAPI {
  open(dialog, trigger_id) {
    const data = { dialog, trigger_id };
    return this.post_('conversations.unarchive', data);
  }
}

class DND extends BaseAPI {
  endDnd() {
    return this.post_('dnd.endDnd');
  }

  endSnooze() {
    return this.post_('dnd.endSnooze');
  }

  info(user) {
    const params = { user };
    return this.get_('dnd.info', params);
  }

  setSnooze(num_minutes) {
    const params = { num_minutes };
    return this.get_('dnd.setSnooze', params);
  }

  teamInfo(users = null) {
    const params = { users };
    return this.get_('dnd.teamInfo', params);
  }
}

class Emoji extends BaseAPI {
  list() {
    return this.get_('emoji.list');
  }
}

class FilesComments extends BaseAPI {
  add(comment, file) {
    const data = { comment, file };
    return this.post_('files.comments.add', data);
  }

  delete(file, id) {
    const data = { file, id };
    return this.post_('files.comments.delete', data);
  }

  edit(comment, file, id) {
    const data = { comment, file, id };
    return this.post_('files.comments.edit', data);
  }
}

class Files extends BaseAPI {
  public comments;
  constructor(token, retries_limit) {
    super(token, retries_limit);
    this.comments = new FilesComments(token, retries_limit);
  }

  delete(file) {
    const data = { file };
    return this.post_('files.delete', data);
  }

  info(file, count = 100, page = 1) {
    const params = { file, count, page };
    return this.get_('files.info', params);
  }

  list(channel, count = 100, page = 1, ts_from, ts_to, types, user) {
    const params = { channel, count, page, ts_from, ts_to, types, user };
    return this.get_('files.list', params);
  }

  revokePublicURL(file) {
    const data = { file };
    return this.post_('files.revokePublicURL', data);
  }

  sharedPublicURL(file) {
    const data = { file };
    return this.post_('files.sharedPublicURL', data);
  }

  upload(
    channels = [],
    content = null,
    file = null,
    filename = null,
    filetype = null,
    initial_comment = null,
    title = null
  ) {
    const data = { channels, content, file, filename, filetype, initial_comment, title };
    return this.post_('files.upload', data);
  }
}

class Groups extends BaseAPI {
  archive(channel: string) {
    const data = { channel };
    return this.post_('groups.archive', data);
  }

  create(name: string, validate: boolean) {
    const params = { name, validate };
    return this.get_('groups.create', params);
  }

  createChild(channel) {
    const params = { channel };
    return this.get_('groups.createChild', params);
  }

  history(
    channel: string,
    count: number = 100,
    inclusive = false,
    latest = 'now',
    oldest = 0,
    unreads = false
  ) {
    const params = { channel, count, inclusive, latest, oldest, unreads };
    return this.get_('groups.history', params);
  }

  info(channel, include_locale = false) {
    const params = { channel, include_locale };
    return this.get_('groups.info', params);
  }

  invite(channel, user) {
    const data = { channel, user };
    return this.post_('groups.invite', data);
  }

  join(name, validate = false) {
    const data = { name, validate };
    return this.post_('groups.join', data);
  }

  kick(channel, user) {
    const data = { channel, user };
    return this.post_('groups.kick', data);
  }

  leave(channel) {
    const data = { channel };
    return this.post_('groups.leave', data);
  }

  list(cursor = null, exclude_archived = false, exclude_members = false) {
    const params = { cursor, exclude_archived, exclude_members };
    return this.get_('groups.list', params);
  }

  mark(channel, ts) {
    const data = { channel, ts };
    return this.post_('groups.mark', data);
  }

  open(channel) {
    const data = { channel };
    return this.post_('groups.mark', data);
  }

  rename(channel, name, validate = null) {
    const params = { validate, channel, name };
    return this.get_('groups.rename');
  }

  replies(channel, thread_ts) {
    const params = { channel, thread_ts };
    return this.get_('groups.replies', params);
  }

  setPurpose(channel, purpose) {
    const data = { channel, purpose };
    return this.post_('groups.setPurpose', data);
  }

  setTopic(channel, topic) {
    const data = { channel, topic };
    return this.post_('groups.setTopic', data);
  }

  unarchive(channel) {
    const data = { channel };
    return this.post_('groups.unarchive', data);
  }
}

class IM extends BaseAPI {
  close(channel) {
    const data = { channel };
    return this.post_('im.close', data);
  }

  history(
    channel: string,
    count: number = 100,
    inclusive = false,
    latest = 'now',
    oldest = 0,
    unreads = false
  ) {
    const params = { channel, count, inclusive, latest, oldest, unreads };
    return this.get_('im.history', params);
  }

  list(cursor = null, limit = null) {
    const params = { cursor, limit };
    return this.get_('im.list', params);
  }

  mark(channel, ts) {
    const data = { channel, ts };
    return this.post_('im.mark', data);
  }

  open(channel, user, include_locale = false, return_im = null) {
    const data = { channel, user, include_locale, return_im };
    return this.post_('im.mark', data);
  }

  replies(channel, thread_ts) {
    const params = { channel, thread_ts };
    return this.get_('im.replies', params);
  }
}

class Migration extends BaseAPI {
  exchange(users, to_old = false) {
    const params = { users, to_old };
    return this.post_('migration.exchange', params);
  }
}

class MPIM extends BaseAPI {
  close(channel) {
    const data = { channel };
    return this.post_('mpim.close', data);
  }

  history(
    channel: string,
    count: number = 100,
    inclusive = false,
    latest = 'now',
    oldest = 0,
    unreads = false
  ) {
    const params = { channel, count, inclusive, latest, oldest, unreads };
    return this.get_('mpim.history', params);
  }

  list() {
    return this.get_('mpim.list');
  }

  mark(channel, ts) {
    const data = { channel, ts };
    return this.post_('mpim.mark', data);
  }

  open(channel, user, include_locale = false, return_im = null) {
    const data = { channel, user, include_locale, return_im };
    return this.post_('mpim.mark', data);
  }

  replies(channel, thread_ts) {
    const params = { channel, thread_ts };
    return this.get_('mpim.replies', params);
  }
}

class OAuth extends BaseAPI {
  access(client_id, client_secret, code, redirect_uri = null) {
    const params = { client_id, client_secret, code, redirect_uri };
    const encodedParams = queryEncode(params);
    const url = `${BaseAPI.API_ENDPOINT}oauth.access?${encodedParams}`;
    return this.fetch_(url);
  }

  token(client_id, client_secret, code, redirect_uri = null, single_channel = 0) {
    const params = { client_id, client_secret, code, redirect_uri = null, single_channel };
    const encodedParams = queryEncode(params);
    const url = `${BaseAPI.API_ENDPOINT}oauth.token?${encodedParams}`;
    return this.fetch_(url);
  }
}

class Pins extends BaseAPI {
  add(channel, file = null, file_comment = null, timestamp = null) {
    const data = { channel, file, file_comment, timestamp };
    return this.post_('pins.add', data);
  }

  list(channel) {
    const params = { channel };
    return this.post_('pins.add', params);
  }

  remove(channel, file = null, file_comment = null, timestamp = null) {
    const data = { channel, file, file_comment, timestamp };
    return this.post_('pins.remove', data);
  }
}

class Reactions extends BaseAPI {
  add(name, channel = null, file = null, file_comment = null, timestamp = null) {
    const data = { name, channel, file, file_comment, timestamp };
    return this.post_('reactions.add', data);
  }

  get(channel = null, file = null, file_comment = null, timestamp = null) {
    const params = { channel, file, file_comment, timestamp };
    return this.get_('reactions.get', params);
  }

  list(count = 100, full = null, page = 1, user = null) {
    const params = { count, full, page, user };
    return this.post_('reactions.list', params);
  }

  remove(name, channel = null, file = null, file_comment = null, timestamp = null) {
    const data = { name, channel, file, file_comment, timestamp };
    return this.post_('reactions.remove', data);
  }
}

export class Methods {
  public api;
  public apps;
  public auth;
  public bots;
  public channels;
  public chat;
  public conversations;
  public dialog;
  public dnd;
  public emoji;
  public files;
  public groups;
  public im;
  public migration;
  public mpim;
  public oauth;
  public pins;
  public reactions;
  public reminders;
  public rtm;
  public search;
  public stars;
  public team;
  public usergroups;
  public users;

  constructor(token, retries_limit = DEFAULT_RETRIES) {
    this.api = new API(token, retries_limit);
    this.apps = new Apps(token, retries_limit);
    this.auth = new Auth(token, retries_limit);
    this.bots = new Bots(token, retries_limit);
    this.channels = new Channels(token, retries_limit);
    this.chat = new Chat(token, retries_limit);
    this.conversations = new Conversations(token, retries_limit);
    this.dialog = new Dialog(token, retries_limit);
    this.dnd = new DND(token, retries_limit);
    this.emoji = new Emoji(token, retries_limit);
    this.files = new Files(token, retries_limit);
    this.groups = new Groups(token, retries_limit);
    this.im = new IM(token, retries_limit);
    this.migration = new Migration(token, retries_limit);
    this.mpim = new MPIM(token, retries_limit);
    this.oauth = new OAuth(token, retries_limit);
    this.pins = new Pins(token, retries_limit);
    this.reactions = new Reactions(token, retries_limit);
    // this.reminders = new Reminders(token, retries_limit);
    // this.rtm = new RTM(token, retries_limit);
    // this.search = new Search(token, retries_limit);
    // this.stars = new Stars(token, retries_limit);
    // this.team = new Team(token, retries_limit);
    // this.usergroups = new UserGroups(token, retries_limit);
    // this.users = new Users(token, retries_limit);

    // this.presence = new Presence(token, retries_limit);
    // this.idpgroups = new IDPGroups(token, retries_limit);
    // this.incomingwebhook = new IncomingWebhook(url);
  }
}