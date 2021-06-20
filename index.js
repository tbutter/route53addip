const {
    Route53Client,
    ListResourceRecordSetsCommand,
    ChangeResourceRecordSetsCommand,
} = require("@aws-sdk/client-route-53");

async function main() {
  try {
    await doChanges();
  } catch(e) {
    console.log("error - retrying"+e);
    await doChanges();
  }
}

async function doChanges() {
    const client = new Route53Client({region: "us-east-1"});

    const zoneId = process.argv[2];
	const domain = process.argv[3].endsWith(".") ? process.argv[3] : (process.argv[3] + ".");
    const action = process.argv[4];
    const ip = process.argv[5];

    const listParams = {
        HostedZoneId: zoneId,
        MaxItems: 1,
        StartRecordName: domain,
        StartRecordType: "A",
    };

    console.log(listParams);

    const listCommand = new ListResourceRecordSetsCommand(listParams);
    const listResponse = await client.send(listCommand);

    console.log(listResponse);
    const origRRS = listResponse.ResourceRecordSets[0];
    let rrs;
    if (origRRS == undefined || origRRS.Name != domain) {
        rrs = {
            Name: domain,
            Type: "A",
            TTL: 60,
            ResourceRecords: [],
        };
	} else {
		rrs = {
            Name: origRRS.Name,
            Type: origRRS.Type,
            TTL: origRRS.TTL,
            ResourceRecords: [...origRRS.ResourceRecords],
        };
    }
    if (action == "del") {
        rrs.ResourceRecords = rrs.ResourceRecords.filter((r) => r.Value != ip);
    } else if (action == "add") {
        rrs.ResourceRecords.push({ Value: ip });
    } else {
        console.log("unkown action " + action);
        return;
    }
	let changeCommand = {
        HostedZoneId: zoneId,
        ChangeBatch: {
            Changes: [],
        },
	};
	console.log(origRRS);
    if (origRRS !== undefined && origRRS.Name === domain) {
        changeCommand.ChangeBatch.Changes.push({
            Action: "DELETE",
            ResourceRecordSet: {
                Name: origRRS.Name,
                Type: origRRS.Type,
                TTL: origRRS.TTL,
                ResourceRecords: origRRS.ResourceRecords,
            },
        });
	}
	if (rrs.ResourceRecords.length > 0) {
		changeCommand.ChangeBatch.Changes.push({
			Action: "CREATE",
			ResourceRecordSet: rrs,
		});
	}
	console.log(JSON.stringify(changeCommand));
    const changeRRSCommand = new ChangeResourceRecordSetsCommand(changeCommand);
    const changeResponse = await client.send(changeRRSCommand);
	console.log(changeResponse);
	process.exit(0);
}

main();
