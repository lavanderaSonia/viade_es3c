import React from "react";
import {
	Header,
	RouteWrapper,
	MyRouteContainer,
	FormRenderContainer,
	Friends,
	Button,
	FormAddFriends
} from "./myfriends.style";
import { List } from "@solid/react";
import InfoFriends from "./InfoFriends";
import friendsHelper from "./FriendsHelper";
import { successToaster, errorToaster } from "@utils";
import i18n from "i18n";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = { webId: String };

class MyFriends extends React.Component {
	constructor({ webId }: Props) {
		super();
		this.webID = webId;
		this.state = {
			friendWebID: ""
		};
		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(event) {
		this.setState({ friendWebID: event.target.value });
	}

	getList() {
		return (
			<Friends>
				<List src={"user.friends"}>
					{(item, i) => (
						<InfoFriends
							key={i}
							name={getUserName(`${item}`)}
							url={<a href={getUrl(`${item}`)}>{getUrl(`${item}`)}</a>}
							webidUser={this.webID}
							webidFriend={`${item}`}
						/>
					)}
				</List>
			</Friends>
		);
	}

	async handleClick(e) {
		e.preventDefault();
		if (this.state.friendWebID !== "") {
			await friendsHelper.addFriend(this.webID, this.state.friendWebID);
			successToaster(
				i18n.t("myFriends.adding") + this.state.friendWebID + i18n.t("myFriends.addingList"),
				i18n.t("newRoute.success")
			);
			setTimeout(function() {
				window.location.reload();
			}, 1000);
		} else {
			errorToaster(i18n.t("myFriends.webId"));
		}
	}

	addFriends() {
		return (
			<FormAddFriends>
				<form>
					<label>
						{i18n.t("myFriends.webId")}
						<input
							id="friendID"
							type="text"
							name="webID"
							onChange={this.handleChange}
							placeholder={"Example: " + this.webID}
						/>

						<Button id="botonaddfriends" type="button" onClick={(e) => this.handleClick(e)}>
							<FontAwesomeIcon icon="user-plus" className="user-plus-icon" />
						</Button>
					</label>
				</form>
			</FormAddFriends>
		);
	}

	render(): React.ReactNode {
		return (
			<RouteWrapper data-testid="route-component">
				<MyRouteContainer>
					<FormRenderContainer>
						<Header>
							<h1>{i18n.t("myFriends.friends")}</h1>
						</Header>
						{this.addFriends()}
						<hr />
						{this.getList()}
					</FormRenderContainer>
				</MyRouteContainer>
			</RouteWrapper>
		);
	}
}

export const getUserName = (name) => {
	let author = name.replace("https://", "");
	author = author.replace(".solid.community/profile/card#me", "");
	author = author.replace(".inrupt.net/profile/card#me", "");
	return author;
};

export const getPathShareRoutes = (name) => {
	let author = name.replace("profile/card#me", "private/viade/shared/");
	return author;
};

export const getUrl = (name) => {
	return name.replace("profile/card#me", "");
};

export const removeFriend = (webIdUser, friendWebID) => {
	friendsHelper.deleteFriend(webIdUser, friendWebID);
	successToaster(
		i18n.t("myFriends.deleting") + friendWebID + i18n.t("myFriends.friendsList"),
		i18n.t("newRoute.success")
	);
	setTimeout(function() {
		window.location.reload();
	}, 1000);
};

export default MyFriends;
