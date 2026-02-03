/**
 * Azure AD Integration Service
 * 
 * This service handles integration with Microsoft Azure AD for:
 * - Authentication via MSAL (Microsoft Authentication Library)
 * - Group management and user synchronization
 * - Role-based access control via Azure AD Groups
 * 
 * Configuration:
 * - Set environment variables:
 *   - NEXT_PUBLIC_AZURE_CLIENT_ID: Your Azure AD App Registration Client ID
 *   - NEXT_PUBLIC_AZURE_TENANT_ID: Your Azure AD Tenant ID
 *   - NEXT_PUBLIC_AZURE_REDIRECT_URI: Redirect URI (e.g., http://localhost:3000)
 */

import { PublicClientApplication, AccountInfo, AuthenticationResult } from "@azure/msal-browser"
import { Client } from "@microsoft/microsoft-graph-client"

// Azure AD Configuration
const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || "common"}`,
    redirectUri: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || "",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
}

// MSAL instance (only on client side)
let msalInstance: PublicClientApplication | null = null

if (typeof window !== "undefined") {
  try {
    msalInstance = new PublicClientApplication(msalConfig)
    msalInstance.initialize()
  } catch (error) {
    console.error("Failed to initialize MSAL:", error)
  }
}

// Microsoft Graph API scopes
const graphScopes = ["User.Read", "Group.Read.All", "GroupMember.Read.All"]

/**
 * Get Microsoft Graph API client with authentication
 */
export async function getGraphClient(): Promise<Client | null> {
  if (typeof window === "undefined" || !msalInstance) {
    return null
  }

  try {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length === 0) {
      return null
    }

    const account = accounts[0]
    const response = await msalInstance.acquireTokenSilent({
      scopes: graphScopes,
      account: account,
    })

    return Client.init({
      authProvider: (done) => {
        done(null, response.accessToken)
      },
    })
  } catch (error) {
    console.error("Failed to get Graph client:", error)
    return null
  }
}

/**
 * Sign in user with Azure AD
 */
export async function signInWithAzure(): Promise<AuthenticationResult | null> {
  if (typeof window === "undefined" || !msalInstance) {
    return null
  }

  try {
    const loginRequest = {
      scopes: graphScopes,
    }

    const response = await msalInstance.loginPopup(loginRequest)
    return response
  } catch (error) {
    console.error("Azure AD sign-in failed:", error)
    return null
  }
}

/**
 * Sign out user from Azure AD
 */
export async function signOutFromAzure(): Promise<void> {
  if (typeof window === "undefined" || !msalInstance) {
    return
  }

  try {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      await msalInstance.logoutPopup({
        account: accounts[0],
      })
    }
  } catch (error) {
    console.error("Azure AD sign-out failed:", error)
  }
}

/**
 * Get current authenticated user from Azure AD
 */
export async function getCurrentAzureUser(): Promise<AccountInfo | null> {
  if (typeof window === "undefined" || !msalInstance) {
    return null
  }

  try {
    const accounts = msalInstance.getAllAccounts()
    return accounts.length > 0 ? accounts[0] : null
  } catch (error) {
    console.error("Failed to get current Azure user:", error)
    return null
  }
}

/**
 * Azure AD Group interface
 */
export interface AzureAdGroup {
  id: string
  displayName: string
  description?: string
  mail?: string
  mailEnabled: boolean
  securityEnabled: boolean
  groupTypes: string[]
}

/**
 * Azure AD User interface
 */
export interface AzureAdUser {
  id: string
  displayName: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  department?: string
}

/**
 * Get all Azure AD Groups
 */
export async function getAzureAdGroups(): Promise<AzureAdGroup[]> {
  const client = await getGraphClient()
  if (!client) {
    return []
  }

  try {
    const response = await client.api("/groups").get()
    return response.value || []
  } catch (error) {
    console.error("Failed to fetch Azure AD groups:", error)
    return []
  }
}

/**
 * Get a specific Azure AD Group by ID
 */
export async function getAzureAdGroup(groupId: string): Promise<AzureAdGroup | null> {
  const client = await getGraphClient()
  if (!client) {
    return null
  }

  try {
    const group = await client.api(`/groups/${groupId}`).get()
    return group
  } catch (error) {
    console.error(`Failed to fetch Azure AD group ${groupId}:`, error)
    return null
  }
}

/**
 * Get members of an Azure AD Group
 */
export async function getAzureAdGroupMembers(groupId: string): Promise<AzureAdUser[]> {
  const client = await getGraphClient()
  if (!client) {
    return []
  }

  try {
    const response = await client.api(`/groups/${groupId}/members/microsoft.graph.user`).get()
    return response.value || []
  } catch (error) {
    console.error(`Failed to fetch members of Azure AD group ${groupId}:`, error)
    return []
  }
}

/**
 * Get member count of an Azure AD Group
 */
export async function getAzureAdGroupMemberCount(groupId: string): Promise<number> {
  const members = await getAzureAdGroupMembers(groupId)
  return members.length
}

/**
 * Check if user is member of an Azure AD Group
 */
export async function isUserMemberOfGroup(userId: string, groupId: string): Promise<boolean> {
  const client = await getGraphClient()
  if (!client) {
    return false
  }

  try {
    const response = await client
      .api(`/users/${userId}/memberOf/microsoft.graph.group`)
      .filter(`id eq '${groupId}'`)
      .get()
    return (response.value?.length || 0) > 0
  } catch (error) {
    console.error(`Failed to check group membership:`, error)
    return false
  }
}

/**
 * Search Azure AD Groups by name
 */
export async function searchAzureAdGroups(searchTerm: string): Promise<AzureAdGroup[]> {
  const client = await getGraphClient()
  if (!client) {
    return []
  }

  try {
    const response = await client
      .api("/groups")
      .filter(`startswith(displayName,'${searchTerm}')`)
      .get()
    return response.value || []
  } catch (error) {
    console.error("Failed to search Azure AD groups:", error)
    return []
  }
}

/**
 * Sync users from Azure AD Group to local store
 * This function maps Azure AD users to local AuthUser format
 */
export async function syncUsersFromAzureGroup(
  groupId: string,
  role: "admin" | "supervisor" | "worker"
): Promise<{
  success: boolean
  syncedCount: number
  users: Array<{
    azureAdId: string
    email: string
    name: string
    role: "admin" | "supervisor" | "worker"
  }>
}> {
  try {
    const members = await getAzureAdGroupMembers(groupId)
    
    const syncedUsers = members.map((member) => ({
      azureAdId: member.id,
      email: member.mail || member.userPrincipalName,
      name: member.displayName,
      role: role,
    }))

    return {
      success: true,
      syncedCount: syncedUsers.length,
      users: syncedUsers,
    }
  } catch (error) {
    console.error(`Failed to sync users from Azure AD group ${groupId}:`, error)
    return {
      success: false,
      syncedCount: 0,
      users: [],
    }
  }
}

/**
 * Check if Azure AD is configured
 */
export function isAzureAdConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_AZURE_CLIENT_ID &&
    process.env.NEXT_PUBLIC_AZURE_TENANT_ID
  )
}
