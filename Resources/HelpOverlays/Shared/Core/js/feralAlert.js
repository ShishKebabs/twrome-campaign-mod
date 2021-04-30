"use strict"

startupPostPropertyLoadTasks.push(initialiseTextFieldList);

function initialiseTextFieldList()
{
	var promise = hookPropertyToFunction( 	"AlertDialogInitialiseTextFieldList",
						"int",
		function(propertyName, typePattern, propValueArray) 
		{ 
			var elementToAttachTo = $("#AlertDialogTextFieldContainer"); // fetch the div we wish to atach the textFields to
			var numOfTextFields = propValueArray[0];

			var i;
			for(i = 0; i < numOfTextFields; i++)
			{
				if(elementToAttachTo.find(`#alertDialogTextField-${i}`).length === 0)
				{
					console.log("creating text field " + i);
					var NewTextField = $( `
<div class="AlertDialogTextField" data-visible-name="AlertDialogTextFieldVisible-${i}">
	<label for="alertDialogTextField-${i}" data-inner-string="AlertDialogTextFieldName-${i}"></label>
	<input type="text"
	       id="alertDialogTextField-${i}"
	       data-property-name="AlertDialogTextFieldValue-${i}"
	       data-property-type="string"
	       data-placeholder-string="AlertDialogTextFieldHint-${i}" />
</div>` );
					elementToAttachTo.append(NewTextField);
					initialiseGenericElementReplacementsWithinElement(NewTextField);
					initialisePropertiesWithinElement(NewTextField, true/*checkRootelements*/);
					initialiseInputElementHandlersWithinElement(NewTextField);
				}
			}

			return true;
		}
	);

	return promise;
}
